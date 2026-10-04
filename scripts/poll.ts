/**
 * Venue poller: pulls live markets from Polymarket (Gamma) and Kalshi,
 * upserts them into markets_raw, snapshots prices for every non-retired
 * pair, and opens/closes discrepancy rows as spreads move.
 *
 * Run: npx tsx scripts/poll.ts
 * Exit 0 on success, 1 with a clear log on failure. On fetch/validation
 * failure the database is left untouched (the site keeps serving the last
 * verified data).
 */
import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../api/queries/connection";
import { discrepancies, marketsRaw, pairs, snapshots } from "../db/schema";

const POLYMARKET_URL =
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=100";
const KALSHI_URL =
  "https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=100";

/** Open a discrepancy row when the spread reaches this many points. */
const OPEN_THRESHOLD_POINTS = 2.0;
/** Close an open discrepancy when the spread narrows below this. */
const CLOSE_THRESHOLD_POINTS = 1.0;
/** Skip a snapshot when the previous one is younger than this (idempotence). */
const SNAPSHOT_DEDUPE_MS = 55 * 60 * 1000;

// ── Upstream response schemas (drift fails loudly, never silently) ──────────
const polymarketMarket = z.object({
  id: z.string(),
  question: z.string(),
  category: z.string().nullish(),
  endDate: z.string().nullish(),
  outcomes: z.string().nullish(),
  outcomePrices: z.string().nullish(),
  volume: z.union([z.string(), z.number()]).nullish(),
  active: z.boolean().optional(),
  closed: z.boolean().optional(),
});
const polymarketResponse = z.array(polymarketMarket);

const kalshiMarket = z.object({
  ticker: z.string(),
  title: z.string(),
  category: z.string().nullish(),
  close_time: z.string().nullish(),
  yes_bid: z.number().nullish(),
  yes_ask: z.number().nullish(),
  last_price: z.number().nullish(),
  volume: z.number().nullish(),
  status: z.string().optional(),
});
const kalshiResponse = z.object({
  markets: z.array(kalshiMarket),
  cursor: z.string().optional(),
});

type PolymarketMarket = z.infer<typeof polymarketMarket>;
type KalshiMarket = z.infer<typeof kalshiMarket>;

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Yes-side implied probability (0-1) from a Polymarket market, or null. */
function polymarketPrice(m: PolymarketMarket): number | null {
  if (!m.outcomePrices) return null;
  try {
    const prices: unknown = JSON.parse(m.outcomePrices);
    if (!Array.isArray(prices) || prices.length === 0) return null;
    const p = Number(prices[0]);
    return Number.isFinite(p) && p >= 0 && p <= 1 ? p : null;
  } catch {
    return null;
  }
}

/** Yes-side implied probability (0-1) from a Kalshi market, or null. */
function kalshiPrice(m: KalshiMarket): number | null {
  const bid = m.yes_bid ?? null;
  const ask = m.yes_ask ?? null;
  if (bid !== null && ask !== null && ask >= bid && ask > 0) return (bid + ask) / 200;
  if (m.last_price !== null && m.last_price !== undefined) {
    const p = m.last_price / 100;
    return p >= 0 && p <= 1 ? p : null;
  }
  return null;
}

async function fetchJson(url: string, label: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "igniise-poller/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`${label} fetch failed: HTTP ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function main(): Promise<void> {
  // ── 1. Fetch + validate BOTH venues before touching the database ────────
  console.log("[poll] fetching venue markets...");
  const [polyRaw, kalshiRaw] = await Promise.all([
    fetchJson(POLYMARKET_URL, "polymarket"),
    fetchJson(KALSHI_URL, "kalshi"),
  ]);

  const polyParsed = polymarketResponse.safeParse(polyRaw);
  if (!polyParsed.success) {
    throw new Error(`polymarket schema drift: ${polyParsed.error.message}`);
  }
  const kalshiParsed = kalshiResponse.safeParse(kalshiRaw);
  if (!kalshiParsed.success) {
    throw new Error(`kalshi schema drift: ${kalshiParsed.error.message}`);
  }
  const polyMarkets = polyParsed.data;
  const kalshiMarkets = kalshiParsed.data.markets;
  console.log(`[poll] fetched ${polyMarkets.length} polymarket, ${kalshiMarkets.length} kalshi markets`);

  const db = getDb();
  const now = new Date();

  // ── 2. Upsert raw markets ────────────────────────────────────────────────
  let upserted = 0;
  for (const m of polyMarkets) {
    await db
      .insert(marketsRaw)
      .values({
        venue: "polymarket",
        venueMarketId: m.id,
        title: m.question.slice(0, 512),
        category: (m.category ?? "general").slice(0, 32),
        closeTime: parseDate(m.endDate),
        resolutionRules: null,
        rawJson: m,
        pulledAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          title: m.question.slice(0, 512),
          category: (m.category ?? "general").slice(0, 32),
          closeTime: parseDate(m.endDate),
          rawJson: m,
          pulledAt: now,
        },
      });
    upserted += 1;
  }
  for (const m of kalshiMarkets) {
    await db
      .insert(marketsRaw)
      .values({
        venue: "kalshi",
        venueMarketId: m.ticker,
        title: m.title.slice(0, 512),
        category: (m.category ?? "general").slice(0, 32),
        closeTime: parseDate(m.close_time),
        resolutionRules: null,
        rawJson: m,
        pulledAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          title: m.title.slice(0, 512),
          category: (m.category ?? "general").slice(0, 32),
          closeTime: parseDate(m.close_time),
          rawJson: m,
          pulledAt: now,
        },
      });
    upserted += 1;
  }
  console.log(`[poll] upserted ${upserted} raw markets`);

  // ── 3. Snapshot all non-retired pairs ────────────────────────────────────
  const activePairs = await db.select().from(pairs).where(ne(pairs.status, "retired"));
  if (activePairs.length === 0) {
    console.log("[poll] no active pairs — nothing to snapshot");
    return;
  }

  const polyByMarketId = new Map(polyMarkets.map((m) => [m.id, m]));
  const kalshiByTicker = new Map(kalshiMarkets.map((m) => [m.ticker, m]));

  let snapshotted = 0;
  let skipped = 0;
  for (const pair of activePairs) {
    const [polyRow] = await db.select().from(marketsRaw).where(eq(marketsRaw.id, pair.polymarketId)).limit(1);
    const [kalshiRow] = await db.select().from(marketsRaw).where(eq(marketsRaw.id, pair.kalshiId)).limit(1);
    if (!polyRow || !kalshiRow) {
      console.warn(`[poll] pair ${pair.id} (${pair.event}): missing raw market rows, skipping`);
      skipped += 1;
      continue;
    }

    const polyMarket = polyByMarketId.get(polyRow.venueMarketId);
    const kalshiMkt = kalshiByTicker.get(kalshiRow.venueMarketId);
    const priceA = polyMarket ? polymarketPrice(polyMarket) : null;
    const priceB = kalshiMkt ? kalshiPrice(kalshiMkt) : null;
    if (priceA === null || priceB === null) {
      // Venue no longer lists this market (or price unparsable) — keep last data.
      console.warn(`[poll] pair ${pair.id} (${pair.event}): no live quote this cycle, skipping snapshot`);
      skipped += 1;
      continue;
    }

    // Idempotence: skip when an identical-price snapshot exists within the window.
    const lastRows = await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.pairId, pair.id))
      .orderBy(desc(snapshots.ts))
      .limit(2);
    const lastA = lastRows.find((r) => r.venue === "polymarket");
    const lastB = lastRows.find((r) => r.venue === "kalshi");
    const fresh =
      lastA &&
      lastB &&
      now.getTime() - lastA.ts.getTime() < SNAPSHOT_DEDUPE_MS &&
      now.getTime() - lastB.ts.getTime() < SNAPSHOT_DEDUPE_MS &&
      Math.abs(lastA.price - priceA) < 0.0001 &&
      Math.abs(lastB.price - priceB) < 0.0001;
    if (fresh) {
      skipped += 1;
    } else {
      const volA = polyMarket?.volume != null ? Number(polyMarket.volume) : null;
      const volB = kalshiMkt?.volume != null ? Number(kalshiMkt.volume) : null;
      await db.insert(snapshots).values([
        { pairId: pair.id, venue: "polymarket", price: priceA, volume: Number.isFinite(volA) ? volA : null, ts: now },
        { pairId: pair.id, venue: "kalshi", price: priceB, volume: volB != null && Number.isFinite(volB) ? volB : null, ts: now },
      ]);
      snapshotted += 1;
    }

    // ── 4. Discrepancy open/update/close ──────────────────────────────────
    const spread = Math.round(Math.abs(priceA - priceB) * 100 * 100) / 100; // points, 2dp
    const direction = priceA >= priceB ? "polymarket" : "kalshi";
    const [open] = await db
      .select()
      .from(discrepancies)
      .where(and(eq(discrepancies.pairId, pair.id), isNull(discrepancies.closedAt)))
      .orderBy(desc(discrepancies.openedAt))
      .limit(1);

    if (!open && spread >= OPEN_THRESHOLD_POINTS) {
      await db.insert(discrepancies).values({
        pairId: pair.id,
        spreadPoints: spread,
        direction,
        openedAt: now,
        maxSpread: spread,
      });
      console.log(`[poll] opened discrepancy on pair ${pair.id}: ${spread}pt (${direction} rich)`);
    } else if (open) {
      if (spread < CLOSE_THRESHOLD_POINTS) {
        await db.update(discrepancies).set({ closedAt: now }).where(eq(discrepancies.id, open.id));
        console.log(`[poll] closed discrepancy ${open.id} on pair ${pair.id}: spread narrowed to ${spread}pt`);
      } else if (open.maxSpread === null || spread > open.maxSpread) {
        await db
          .update(discrepancies)
          .set({ maxSpread: spread, peakedAt: now })
          .where(eq(discrepancies.id, open.id));
      }
    }
  }

  console.log(`[poll] snapshotted ${snapshotted} pairs, skipped ${skipped}`);
}

main()
  .then(() => {
    console.log("[poll] OK");
    process.exit(0);
  })
  .catch((err) => {
    console.error(`[poll] FAILED: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
