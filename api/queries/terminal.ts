import { and, asc, desc, eq, gte, inArray, ne } from "drizzle-orm";
import { agentDecisions, discrepancies, pairs, resolutions, snapshots } from "@db/schema";
import type {
  AgentLogEntry,
  DiscrepancyEntry,
  PairDetail,
  PairFeedItem,
  SpreadPoint,
  SpreadRange,
  TerminalCategory,
  TerminalFeed,
  TerminalStats,
  Venue,
} from "@contracts/terminal";
import { getDb } from "./connection";

const RANGE_DAYS: Record<SpreadRange, number> = { "7d": 7, "30d": 30, "90d": 90 };
const SPARK_SAMPLES = 24;

const round1 = (n: number) => Math.round(n * 10) / 10;

type PairRow = typeof pairs.$inferSelect;
type SnapshotRow = typeof snapshots.$inferSelect;

/** Group snapshots by timestamp and derive the per-timestamp spread series. */
function spreadSeries(rows: SnapshotRow[]): SpreadPoint[] {
  const byTs = new Map<number, { ts: Date; a?: number; b?: number }>();
  for (const r of rows) {
    const key = r.ts.getTime();
    const bucket = byTs.get(key) ?? { ts: r.ts };
    if (r.venue === "polymarket") bucket.a = r.price;
    else if (r.venue === "kalshi") bucket.b = r.price;
    byTs.set(key, bucket);
  }
  return [...byTs.values()]
    .sort((x, y) => x.ts.getTime() - y.ts.getTime())
    .filter((b) => b.a !== undefined && b.b !== undefined)
    .map((b) => ({
      ts: b.ts.toISOString(),
      priceA: round1(b.a! * 100),
      priceB: round1(b.b! * 100),
      spread: round1(Math.abs(b.a! - b.b!) * 100),
    }));
}

function latestByVenue(rows: SnapshotRow[]): { a?: number; b?: number } {
  let a: number | undefined;
  let b: number | undefined;
  for (const r of rows) {
    if (r.venue === "polymarket") a = r.price;
    else if (r.venue === "kalshi") b = r.price;
  }
  return { a, b };
}

function toFeedItem(pair: PairRow, rows: SnapshotRow[]): PairFeedItem | null {
  const { a, b } = latestByVenue(rows);
  if (a === undefined || b === undefined) return null;
  const history = spreadSeries(rows);
  const priceA = round1(a * 100);
  const priceB = round1(b * 100);
  return {
    id: String(pair.id),
    event: pair.event,
    category: pair.category as TerminalCategory,
    venueA: "Polymarket",
    venueB: "Kalshi",
    priceA,
    priceB,
    spread: round1(Math.abs(priceA - priceB)),
    badge: pair.badge as PairFeedItem["badge"],
    ...(pair.resolutionNote ? { resolutionNote: pair.resolutionNote } : {}),
    spark: history.slice(-SPARK_SAMPLES).map((p) => p.spread),
  };
}

async function fetchSnapshotsFor(pairIds: number[], since?: Date): Promise<SnapshotRow[]> {
  if (pairIds.length === 0) return [];
  const db = getDb();
  const conds = [inArray(snapshots.pairId, pairIds)];
  if (since) conds.push(gte(snapshots.ts, since));
  return db
    .select()
    .from(snapshots)
    .where(and(...conds))
    .orderBy(asc(snapshots.ts));
}

/**
 * Terminal feed: every non-retired pair with latest prices and 24h spark.
 */
export async function getTerminalFeed(category?: TerminalCategory): Promise<TerminalFeed> {
  const db = getDb();
  const conds = [ne(pairs.status, "retired")];
  if (category) conds.push(eq(pairs.category, category));
  const pairRows = await db
    .select()
    .from(pairs)
    .where(and(...conds))
    .orderBy(asc(pairs.id));

  const snapRows = await fetchSnapshotsFor(pairRows.map((p) => p.id));
  const byPair = new Map<number, SnapshotRow[]>();
  let dataAsOf: Date | null = null;
  for (const s of snapRows) {
    const list = byPair.get(s.pairId) ?? [];
    list.push(s);
    byPair.set(s.pairId, list);
    if (!dataAsOf || s.ts > dataAsOf) dataAsOf = s.ts;
  }

  const items = pairRows
    .map((p) => toFeedItem(p, byPair.get(p.id) ?? []))
    .filter((x): x is PairFeedItem => x !== null);

  return {
    pairs: items,
    dataAsOf: (dataAsOf ?? new Date()).toISOString(),
  };
}

/**
 * Global counters. resolutionAccuracy = % of resolved pairs where the venue
 * that was wider at the final observation ended closer to the truth.
 */
export async function getTerminalStats(): Promise<TerminalStats> {
  const db = getDb();
  const zero: TerminalStats = { pairsTracked: 0, discrepanciesLogged: 0, resolutionAccuracy: 0 };

  const activePairs = await db.select({ id: pairs.id }).from(pairs).where(ne(pairs.status, "retired"));
  const allDiscrepancies = await db.select({ id: discrepancies.id }).from(discrepancies);
  const resolutionRows = await db.select().from(resolutions);

  let resolutionAccuracy = 0;
  if (resolutionRows.length > 0) {
    const snapRows = await fetchSnapshotsFor(resolutionRows.map((r) => r.pairId));
    const byPair = new Map<number, SnapshotRow[]>();
    for (const s of snapRows) {
      const list = byPair.get(s.pairId) ?? [];
      list.push(s);
      byPair.set(s.pairId, list);
    }
    let scored = 0;
    let closedGap = 0;
    for (const r of resolutionRows) {
      const rows = (byPair.get(r.pairId) ?? []).filter((s) => s.ts <= r.settledAt);
      const { a, b } = latestByVenue(rows);
      if (a === undefined || b === undefined) continue;
      const truth = /^no/i.test(r.winningOutcome) ? 0 : 1;
      const wider: Venue = Math.abs(a - truth) >= Math.abs(b - truth) ? "polymarket" : "kalshi";
      scored += 1;
      if (r.venueCloserToTruth === wider) closedGap += 1;
    }
    if (scored > 0) resolutionAccuracy = round1((closedGap / scored) * 100);
  }

  return {
    pairsTracked: activePairs.length,
    discrepanciesLogged: allDiscrepancies.length,
    resolutionAccuracy: resolutionRows.length === 0 ? zero.resolutionAccuracy : resolutionAccuracy,
  };
}

/**
 * Pair detail: spread time series for the requested range plus the
 * discrepancy ledger. Returns null when the pair does not exist.
 */
export async function getPairDetail(id: number, range: SpreadRange): Promise<PairDetail | null> {
  const db = getDb();
  const [pair] = await db.select().from(pairs).where(eq(pairs.id, id)).limit(1);
  if (!pair) return null;

  const since = new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000);
  const snapRows = await fetchSnapshotsFor([id], since);
  const allRows = await fetchSnapshotsFor([id]);
  const history = spreadSeries(snapRows);
  const item = toFeedItem(pair, allRows);
  const dataAsOf = allRows.length > 0 ? allRows[allRows.length - 1].ts.toISOString() : new Date().toISOString();

  const ledger = await db
    .select()
    .from(discrepancies)
    .where(eq(discrepancies.pairId, id))
    .orderBy(desc(discrepancies.openedAt));

  const entries: DiscrepancyEntry[] = ledger.map((d) => ({
    id: d.id,
    spreadPoints: d.spreadPoints,
    direction: d.direction as Venue,
    openedAt: d.openedAt.toISOString(),
    peakedAt: d.peakedAt ? d.peakedAt.toISOString() : null,
    closedAt: d.closedAt ? d.closedAt.toISOString() : null,
    maxSpread: d.maxSpread,
  }));

  const base: PairFeedItem =
    item ??
    ({
      id: String(pair.id),
      event: pair.event,
      category: pair.category as TerminalCategory,
      venueA: "Polymarket",
      venueB: "Kalshi",
      priceA: 0,
      priceB: 0,
      spread: 0,
      badge: pair.badge as PairFeedItem["badge"],
      ...(pair.resolutionNote ? { resolutionNote: pair.resolutionNote } : {}),
      spark: [],
    } satisfies PairFeedItem);

  return { ...base, dataAsOf, history, discrepancies: entries };
}

/** Public agent audit log, newest first. */
export async function getAgentLog(limit: number): Promise<AgentLogEntry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(agentDecisions)
    .orderBy(desc(agentDecisions.ts), desc(agentDecisions.id))
    .limit(limit);
  return rows.map((r) => ({
    ts: r.ts.toISOString(),
    action: r.action,
    pair: r.pairLabel,
    confidence: r.confidence,
    reasoning: r.reasoning,
  }));
}
