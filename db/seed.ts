import { getDb } from "../api/queries/connection";
import {
  agentDecisions,
  discrepancies,
  marketsRaw,
  pairs,
  resolutions,
  snapshots,
} from "./schema";

/**
 * Seeds the terminal database with the same 12 pairs and ~20 agent decisions
 * that ship in the frontend mock layer (src/lib/data.ts on the main branch),
 * plus 24 hourly snapshots per pair derived from each pair's spark array.
 *
 * Idempotent: refuses to run when pairs already exist.
 */

// ── Deterministic spark generation (ported from src/lib/data.ts) ────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 24 hourly spread samples drifting around the current spread. */
function sparkFor(spread: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const out: number[] = [];
  let v = Math.max(0.5, spread - 2 + rand() * 2);
  for (let i = 0; i < 24; i++) {
    v += (rand() - 0.48) * 0.9;
    v = Math.max(0.4, Math.min(14, v));
    out.push(Number(v.toFixed(1)));
  }
  out[23] = spread;
  return out;
}

// ── Pair fixtures (ported from src/lib/data.ts PAIRS) ───────────────────────
interface PairSeed {
  slug: string;
  event: string;
  category: "FED_RATES" | "CPI" | "ELECTIONS" | "CRYPTO";
  priceA: number; // cents
  priceB: number; // cents
  spread: number; // points
  badge: "verified" | "auto-matched";
  resolutionNote?: string;
  sparkSeed: number;
}

const PAIR_SEEDS: PairSeed[] = [
  { slug: "fed-dec-25bp", event: "Fed December rate decision: 25bp cut", category: "FED_RATES", priceA: 62.0, priceB: 55.0, spread: 7.0, badge: "verified", resolutionNote: "Both venues resolve against the FOMC statement, December meeting.", sparkSeed: 101 },
  { slug: "fed-jan-hold", event: "Fed January meeting: rates unchanged", category: "FED_RATES", priceA: 48.5, priceB: 52.0, spread: 3.5, badge: "verified", resolutionNote: "Resolves on the January FOMC statement.", sparkSeed: 102 },
  { slug: "fed-2026-easing", event: "Cumulative Fed easing in 2026 above 75bp", category: "FED_RATES", priceA: 34.0, priceB: 31.0, spread: 3.0, badge: "auto-matched", sparkSeed: 103 },
  { slug: "cpi-nov-yoy", event: "US CPI YoY, November print above 3.0%", category: "CPI", priceA: 41.5, priceB: 38.0, spread: 3.5, badge: "verified", resolutionNote: "Both venues resolve against the BLS November CPI release.", sparkSeed: 104 },
  { slug: "cpi-core-dec", event: "US core CPI MoM, December above 0.3%", category: "CPI", priceA: 55.0, priceB: 52.5, spread: 2.5, badge: "auto-matched", sparkSeed: 105 },
  { slug: "pce-q4", event: "Core PCE YoY, Q4 print above 2.8%", category: "CPI", priceA: 47.0, priceB: 49.5, spread: 2.5, badge: "verified", resolutionNote: "Resolves against the BEA core PCE release for the Q4 reference month.", sparkSeed: 106 },
  { slug: "approval-yearend", event: "Presidential approval rating above 45% at year-end", category: "ELECTIONS", priceA: 38.0, priceB: 33.5, spread: 4.5, badge: "verified", resolutionNote: "Both venues resolve against the same polling average on December 31.", sparkSeed: 107 },
  { slug: "senate-2026", event: "Senate control after the 2026 midterms", category: "ELECTIONS", priceA: 52.0, priceB: 47.0, spread: 5.0, badge: "verified", sparkSeed: 108 },
  { slug: "shutdown-mar", event: "Federal government shutdown before March 2026", category: "ELECTIONS", priceA: 29.5, priceB: 27.0, spread: 2.5, badge: "auto-matched", sparkSeed: 109 },
  { slug: "btc-150k", event: "BTC above $150,000 by year-end", category: "CRYPTO", priceA: 27.5, priceB: 18.5, spread: 9.0, badge: "verified", resolutionNote: "Both venues resolve against the same spot reference at December 31, 23:59 UTC.", sparkSeed: 110 },
  { slug: "eth-6k", event: "ETH above $6,000 by year-end", category: "CRYPTO", priceA: 22.0, priceB: 19.0, spread: 3.0, badge: "auto-matched", sparkSeed: 111 },
  { slug: "btc-etf-dec", event: "BTC ETF net inflows positive in December", category: "CRYPTO", priceA: 66.5, priceB: 55.5, spread: 11.0, badge: "verified", resolutionNote: "Resolves against aggregate issuer flow reporting for December.", sparkSeed: 112 },
];

/**
 * Two already-resolved events referenced by RESOLUTION_SCORED audit entries.
 * Seeded as retired pairs so the resolutions ledger has real FK targets.
 */
const RETIRED_SEEDS: (PairSeed & { winningOutcome: string; settledAt: string; venueCloserToTruth: string | null })[] = [
  { slug: "cpi-oct-31", event: "US CPI YoY, October print above 3.1%", category: "CPI", priceA: 55.0, priceB: 49.5, spread: 5.5, badge: "verified", sparkSeed: 201, winningOutcome: "No", settledAt: "2025-12-02T13:00:00Z", venueCloserToTruth: "polymarket" },
  { slug: "btc-140k-nov", event: "BTC above $140,000 in November", category: "CRYPTO", priceA: 3.0, priceB: 2.5, spread: 0.5, badge: "verified", sparkSeed: 202, winningOutcome: "No", settledAt: "2025-12-01T15:00:00Z", venueCloserToTruth: null },
];

// ── Agent decision fixtures (ported from src/lib/data.ts AGENT_DECISIONS) ───
const AGENT_SEEDS: { ts: string; action: string; pair: string; confidence: number; reasoning: string }[] = [
  { ts: "2025-12-03T14:32:00Z", action: "SPREAD_LOGGED", pair: "Fed December rate decision: 25bp cut", confidence: 0.99, reasoning: "Quotes refreshed at both venues. Spread widened to 7.0pt, logged to the discrepancy grid." },
  { ts: "2025-12-03T14:02:00Z", action: "SPREAD_LOGGED", pair: "BTC above $150,000 by year-end", confidence: 0.99, reasoning: "Hourly sample recorded. Polymarket quote moved 1.5pt while Kalshi held, spread now 9.0pt." },
  { ts: "2025-12-03T11:47:00Z", action: "PAIR_VERIFIED", pair: "BTC ETF net inflows positive in December", confidence: 0.97, reasoning: "Human audit confirmed both contracts resolve against aggregate issuer flow reporting. Pair promoted to verified." },
  { ts: "2025-12-03T09:15:00Z", action: "PAIR_PROPOSED", pair: "US core CPI MoM, December above 0.3%", confidence: 0.91, reasoning: "Matcher found candidate contracts on both venues with near-identical resolution text. Queued for audit." },
  { ts: "2025-12-03T08:00:00Z", action: "SPREAD_LOGGED", pair: "US CPI YoY, November print above 3.0%", confidence: 0.99, reasoning: "Hourly sample recorded. Spread steady at 3.5pt across the last six observations." },
  { ts: "2025-12-02T22:30:00Z", action: "SPREAD_LOGGED", pair: "Senate control after the 2026 midterms", confidence: 0.99, reasoning: "Kalshi quote repriced after the session close. Spread recorded at 5.0pt." },
  { ts: "2025-12-02T18:12:00Z", action: "PAIR_REJECTED", pair: "Fed speakers: December press conference wording", confidence: 0.62, reasoning: "Candidate contracts used different resolution sources. Rejected, resolution rules must be identical." },
  { ts: "2025-12-02T16:05:00Z", action: "SPREAD_LOGGED", pair: "Presidential approval rating above 45% at year-end", confidence: 0.99, reasoning: "Hourly sample recorded. Both quotes moved together, spread unchanged at 4.5pt." },
  { ts: "2025-12-02T13:40:00Z", action: "RESOLUTION_SCORED", pair: "US CPI YoY, October print above 3.1%", confidence: 1.0, reasoning: "Event resolved. The wider venue closed 4.0pt of the 5.5pt spread into the print. Scored to the public log." },
  { ts: "2025-12-02T10:22:00Z", action: "PAIR_VERIFIED", pair: "Fed January meeting: rates unchanged", confidence: 0.98, reasoning: "Audit confirmed both venues resolve on the January FOMC statement. Pair promoted to verified." },
  { ts: "2025-12-02T07:58:00Z", action: "SPREAD_LOGGED", pair: "ETH above $6,000 by year-end", confidence: 0.99, reasoning: "Hourly sample recorded. Spread narrowed to 3.0pt from 3.6pt." },
  { ts: "2025-12-01T21:14:00Z", action: "PAIR_PROPOSED", pair: "Cumulative Fed easing in 2026 above 75bp", confidence: 0.87, reasoning: "Matcher aligned contract series across venues. Settlement wording differs in one clause, flagged for audit." },
  { ts: "2025-12-01T17:33:00Z", action: "SPREAD_LOGGED", pair: "Federal government shutdown before March 2026", confidence: 0.99, reasoning: "Hourly sample recorded. Spread steady at 2.5pt." },
  { ts: "2025-12-01T15:01:00Z", action: "RESOLUTION_SCORED", pair: "BTC above $140,000 in November", confidence: 1.0, reasoning: "Event resolved negative. Neither venue held a meaningful edge at the final observation. Scored to the public log." },
  { ts: "2025-12-01T12:45:00Z", action: "SPREAD_LOGGED", pair: "Fed December rate decision: 25bp cut", confidence: 0.99, reasoning: "Polymarket repriced after the afternoon session. Spread moved to 6.6pt, later widened." },
  { ts: "2025-12-01T09:30:00Z", action: "PAIR_VERIFIED", pair: "Presidential approval rating above 45% at year-end", confidence: 0.96, reasoning: "Audit confirmed both contracts resolve against the same polling average on the same date. Pair promoted." },
  { ts: "2025-11-30T20:10:00Z", action: "SPREAD_LOGGED", pair: "BTC above $150,000 by year-end", confidence: 0.99, reasoning: "Weekend liquidity thinned at both venues. Spread recorded at 8.5pt with a staleness flag cleared on refresh." },
  { ts: "2025-11-30T14:26:00Z", action: "PAIR_REJECTED", pair: "ETH staking yield above 4% in Q1", confidence: 0.58, reasoning: "Only one venue lists the contract. No cross-venue pair possible, rejected." },
  { ts: "2025-11-30T08:00:00Z", action: "SPREAD_LOGGED", pair: "Core PCE YoY, Q4 print above 2.8%", confidence: 0.99, reasoning: "Hourly sample recorded. Spread steady at 2.5pt." },
  { ts: "2025-11-29T16:52:00Z", action: "PAIR_VERIFIED", pair: "Senate control after the 2026 midterms", confidence: 0.95, reasoning: "Audit confirmed identical resolution criteria and settlement dates. Pair promoted to verified." },
];

// ── Closed discrepancy ledger fixtures ──────────────────────────────────────
const DISCREPANCY_SEEDS: {
  slug: string;
  spreadPoints: number;
  direction: "polymarket" | "kalshi";
  openedAt: string;
  peakedAt: string;
  closedAt: string;
  maxSpread: number;
}[] = [
  { slug: "fed-dec-25bp", spreadPoints: 4.0, direction: "polymarket", openedAt: "2025-11-28T09:00:00Z", peakedAt: "2025-11-30T18:00:00Z", closedAt: "2025-12-01T12:00:00Z", maxSpread: 8.5 },
  { slug: "btc-150k", spreadPoints: 5.0, direction: "polymarket", openedAt: "2025-11-26T14:00:00Z", peakedAt: "2025-12-01T03:00:00Z", closedAt: "2025-12-02T22:00:00Z", maxSpread: 12.5 },
  { slug: "cpi-nov-yoy", spreadPoints: 2.5, direction: "polymarket", openedAt: "2025-11-20T13:30:00Z", peakedAt: "2025-11-24T16:00:00Z", closedAt: "2025-11-27T09:00:00Z", maxSpread: 6.0 },
  { slug: "btc-etf-dec", spreadPoints: 6.5, direction: "polymarket", openedAt: "2025-11-30T11:00:00Z", peakedAt: "2025-12-02T19:00:00Z", closedAt: "2025-12-03T10:00:00Z", maxSpread: 11.5 },
  { slug: "senate-2026", spreadPoints: 3.0, direction: "polymarket", openedAt: "2025-11-22T15:00:00Z", peakedAt: "2025-11-25T21:00:00Z", closedAt: "2025-11-29T08:00:00Z", maxSpread: 7.0 },
];

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  const existing = await db.select({ id: pairs.id }).from(pairs).limit(1);
  if (existing.length > 0) {
    console.log("Pairs already present — seed is idempotent, nothing to do.");
    process.exit(0);
  }

  const now = new Date();
  now.setUTCMinutes(0, 0, 0);

  const pairIdBySlug = new Map<string, number>();
  let marketsCount = 0;
  let snapshotsCount = 0;

  const insertPair = async (
    p: PairSeed,
    status: "seed" | "retired",
  ): Promise<number> => {
    const [poly] = await db
      .insert(marketsRaw)
      .values({
        venue: "polymarket",
        venueMarketId: `seed-poly-${p.slug}`,
        title: p.event,
        category: p.category,
        closeTime: new Date("2026-12-31T23:59:00Z"),
        resolutionRules: p.resolutionNote ?? null,
        rawJson: { source: "seed", slug: p.slug, price: p.priceA / 100 },
        pulledAt: now,
      })
      .$returningId();
    const [kalshi] = await db
      .insert(marketsRaw)
      .values({
        venue: "kalshi",
        venueMarketId: `seed-kalshi-${p.slug}`,
        title: p.event,
        category: p.category,
        closeTime: new Date("2026-12-31T23:59:00Z"),
        resolutionRules: p.resolutionNote ?? null,
        rawJson: { source: "seed", slug: p.slug, price: p.priceB / 100 },
        pulledAt: now,
      })
      .$returningId();
    marketsCount += 2;

    const [pair] = await db
      .insert(pairs)
      .values({
        event: p.event,
        category: p.category,
        polymarketId: poly.id,
        kalshiId: kalshi.id,
        confidence: p.badge === "verified" ? 0.97 : 0.85,
        status,
        badge: p.badge,
        resolutionNote: p.resolutionNote ?? null,
        createdBy: "seed",
        approvedAt: p.badge === "verified" ? now : null,
      })
      .$returningId();
    return pair.id;
  };

  // Active pairs: 24 hourly snapshots each, derived from the spark array.
  for (const p of PAIR_SEEDS) {
    const pairId = await insertPair(p, "seed");
    pairIdBySlug.set(p.slug, pairId);

    const spark = sparkFor(p.spread, p.sparkSeed);
    const aProb = p.priceA / 100;
    const bSign = p.priceB >= p.priceA ? 1 : -1;
    const rows = spark.flatMap((spreadPts, i) => {
      const ts = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      const bProb = Math.min(0.9999, Math.max(0.0001, aProb + (bSign * spreadPts) / 100));
      return [
        { pairId, venue: "polymarket", price: Number(aProb.toFixed(4)), volume: null, ts },
        { pairId, venue: "kalshi", price: Number(bProb.toFixed(4)), volume: null, ts },
      ];
    });
    await db.insert(snapshots).values(rows);
    snapshotsCount += rows.length;
  }

  // Retired pairs: single final observation per venue just before settlement.
  const retiredPairIds = new Map<string, number>();
  for (const p of RETIRED_SEEDS) {
    const pairId = await insertPair(p, "retired");
    retiredPairIds.set(p.slug, pairId);
    const settledAt = new Date(p.settledAt);
    const ts = new Date(settledAt.getTime() - 60 * 60 * 1000);
    await db.insert(snapshots).values([
      { pairId, venue: "polymarket", price: p.priceA / 100, volume: null, ts },
      { pairId, venue: "kalshi", price: p.priceB / 100, volume: null, ts },
    ]);
    snapshotsCount += 2;
    await db.insert(resolutions).values({
      pairId,
      winningOutcome: p.winningOutcome,
      settledAt,
      venueCloserToTruth: p.venueCloserToTruth,
    });
  }

  // Closed discrepancy ledger.
  for (const d of DISCREPANCY_SEEDS) {
    const pairId = pairIdBySlug.get(d.slug);
    if (!pairId) throw new Error(`Discrepancy fixture references unknown pair ${d.slug}`);
    await db.insert(discrepancies).values({
      pairId,
      spreadPoints: d.spreadPoints,
      direction: d.direction,
      openedAt: new Date(d.openedAt),
      peakedAt: new Date(d.peakedAt),
      closedAt: new Date(d.closedAt),
      maxSpread: d.maxSpread,
    });
  }

  // Public agent audit log.
  const eventToPairId = new Map<string, number>();
  for (const p of PAIR_SEEDS) eventToPairId.set(p.event, pairIdBySlug.get(p.slug)!);
  for (const p of RETIRED_SEEDS) eventToPairId.set(p.event, retiredPairIds.get(p.slug)!);
  for (const a of AGENT_SEEDS) {
    await db.insert(agentDecisions).values({
      action: a.action,
      pairId: eventToPairId.get(a.pair) ?? null,
      pairLabel: a.pair,
      confidence: a.confidence,
      reasoning: a.reasoning,
      model: "igniise-agent-1.0",
      costCents: 2,
      ts: new Date(a.ts),
    });
  }

  console.log(
    `Seeded: ${marketsCount} markets_raw, ${PAIR_SEEDS.length + RETIRED_SEEDS.length} pairs ` +
      `(${RETIRED_SEEDS.length} retired), ${snapshotsCount} snapshots, ` +
      `${DISCREPANCY_SEEDS.length} discrepancies, ${RETIRED_SEEDS.length} resolutions, ` +
      `${AGENT_SEEDS.length} agent_decisions.`,
  );
  console.log("Done.");
  process.exit(0); // close MySQL connection pool
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
