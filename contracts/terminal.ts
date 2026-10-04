/**
 * Shared terminal contracts — the shapes the frontend (src/lib/types.ts)
 * consumes. The API must match these exactly.
 */

export type TerminalCategory = "FED_RATES" | "CPI" | "ELECTIONS" | "CRYPTO";

export const TERMINAL_CATEGORIES = [
  "FED_RATES",
  "CPI",
  "ELECTIONS",
  "CRYPTO",
] as const satisfies readonly TerminalCategory[];

export type VerificationBadge = "verified" | "auto-matched";

export type Venue = "polymarket" | "kalshi";

export const VENUES = ["polymarket", "kalshi"] as const satisfies readonly Venue[];

export type PairStatus = "seed" | "auto" | "queued" | "retired";

export type AgentAction =
  | "PAIR_PROPOSED"
  | "PAIR_VERIFIED"
  | "PAIR_REJECTED"
  | "SPREAD_LOGGED"
  | "RESOLUTION_SCORED";

/** Human-readable labels for the category codes. */
export const CATEGORY_LABELS: Record<TerminalCategory, string> = {
  FED_RATES: "Fed & Rates",
  CPI: "Inflation",
  ELECTIONS: "Elections & Policy",
  CRYPTO: "Crypto",
};

/** One row of the terminal grid. Mirrors the frontend `Pair` type. */
export interface PairFeedItem {
  id: string;
  event: string;
  category: TerminalCategory;
  venueA: "Polymarket";
  venueB: "Kalshi";
  /** Implied probability in cents (0-100) at venue A */
  priceA: number;
  /** Implied probability in cents (0-100) at venue B */
  priceB: number;
  /** Absolute cross-venue spread in points */
  spread: number;
  badge: VerificationBadge;
  resolutionNote?: string;
  /** Last 24 hourly spread samples, oldest first */
  spark: number[];
}

export interface TerminalStats {
  pairsTracked: number;
  discrepanciesLogged: number;
  /** % of resolved pairs where the wider venue closed the gap (0-100) */
  resolutionAccuracy: number;
}

export interface AgentLogEntry {
  /** ISO 8601 UTC timestamp */
  ts: string;
  action: string;
  pair: string;
  /** Model confidence, 0-1 */
  confidence: number | null;
  reasoning: string;
}

/** Time-series point for the pair detail spread chart. */
export interface SpreadPoint {
  /** ISO 8601 UTC timestamp */
  ts: string;
  priceA: number;
  priceB: number;
  spread: number;
}

export interface DiscrepancyEntry {
  id: number;
  spreadPoints: number;
  direction: Venue;
  openedAt: string;
  peakedAt: string | null;
  closedAt: string | null;
  maxSpread: number | null;
}

export type SpreadRange = "7d" | "30d" | "90d";

export interface PairDetail extends PairFeedItem {
  dataAsOf: string;
  history: SpreadPoint[];
  discrepancies: DiscrepancyEntry[];
}

export interface TerminalFeed {
  pairs: PairFeedItem[];
  /** ISO 8601 timestamp of the freshest snapshot underlying the feed */
  dataAsOf: string;
}
