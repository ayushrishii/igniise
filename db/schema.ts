import { sql } from "drizzle-orm";
import {
  mysqlTable,
  serial,
  varchar,
  text,
  datetime,
  decimal,
  bigint,
  int,
  json,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

// ── Raw venue market cache ──────────────────────────────────────────────────
export const marketsRaw = mysqlTable(
  "markets_raw",
  {
    id: serial("id").primaryKey(),
    venue: varchar("venue", { length: 16 }).notNull(), // 'polymarket' | 'kalshi'
    venueMarketId: varchar("venue_market_id", { length: 128 }).notNull(),
    title: varchar("title", { length: 512 }).notNull(),
    category: varchar("category", { length: 32 }).notNull(),
    closeTime: datetime("close_time"),
    resolutionRules: text("resolution_rules"),
    rawJson: json("raw_json").notNull(),
    pulledAt: datetime("pulled_at").notNull(),
  },
  (t) => [uniqueIndex("markets_raw_venue_market_unique").on(t.venue, t.venueMarketId)],
);

// ── Matched cross-venue pairs ───────────────────────────────────────────────
export const pairs = mysqlTable("pairs", {
  id: serial("id").primaryKey(),
  event: varchar("event", { length: 256 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(), // 'FED_RATES' | 'CPI' | 'ELECTIONS' | 'CRYPTO'
  polymarketId: bigint("polymarket_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => marketsRaw.id),
  kalshiId: bigint("kalshi_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => marketsRaw.id),
  confidence: decimal("confidence", { precision: 3, scale: 2, mode: "number" }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("seed"), // 'seed' | 'auto' | 'queued' | 'retired'
  badge: varchar("badge", { length: 16 }).notNull(), // 'verified' | 'auto-matched'
  resolutionNote: varchar("resolution_note", { length: 512 }),
  createdBy: varchar("created_by", { length: 32 }).notNull(),
  approvedAt: datetime("approved_at"),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ── Hourly price snapshots per pair/venue ───────────────────────────────────
export const snapshots = mysqlTable(
  "snapshots",
  {
    id: serial("id").primaryKey(),
    pairId: bigint("pair_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => pairs.id),
    venue: varchar("venue", { length: 16 }).notNull(), // 'polymarket' | 'kalshi'
    price: decimal("price", { precision: 5, scale: 4, mode: "number" }).notNull(), // implied probability 0-1
    volume: decimal("volume", { precision: 14, scale: 2, mode: "number" }),
    ts: datetime("ts").notNull(),
  },
  (t) => [index("snapshots_pair_ts_idx").on(t.pairId, t.ts)],
);

// ── Discrepancy ledger ──────────────────────────────────────────────────────
export const discrepancies = mysqlTable(
  "discrepancies",
  {
    id: serial("id").primaryKey(),
    pairId: bigint("pair_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => pairs.id),
    spreadPoints: decimal("spread_points", { precision: 5, scale: 2, mode: "number" }).notNull(),
    direction: varchar("direction", { length: 16 }).notNull(), // 'polymarket' | 'kalshi' (richer venue)
    openedAt: datetime("opened_at").notNull(),
    peakedAt: datetime("peaked_at"),
    closedAt: datetime("closed_at"),
    maxSpread: decimal("max_spread", { precision: 5, scale: 2, mode: "number" }),
  },
  (t) => [index("discrepancies_pair_idx").on(t.pairId, t.openedAt)],
);

// ── Resolutions / venue accuracy ────────────────────────────────────────────
export const resolutions = mysqlTable(
  "resolutions",
  {
    id: serial("id").primaryKey(),
    pairId: bigint("pair_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => pairs.id),
    winningOutcome: varchar("winning_outcome", { length: 128 }).notNull(),
    settledAt: datetime("settled_at").notNull(),
    venueCloserToTruth: varchar("venue_closer_to_truth", { length: 16 }),
  },
  (t) => [index("resolutions_pair_idx").on(t.pairId)],
);

// ── Public agent audit log ──────────────────────────────────────────────────
export const agentDecisions = mysqlTable(
  "agent_decisions",
  {
    id: serial("id").primaryKey(),
    action: varchar("action", { length: 64 }).notNull(),
    pairId: bigint("pair_id", { mode: "number", unsigned: true }).references(() => pairs.id),
    pairLabel: varchar("pair_label", { length: 256 }).notNull(),
    confidence: decimal("confidence", { precision: 3, scale: 2, mode: "number" }),
    reasoning: text("reasoning").notNull(),
    model: varchar("model", { length: 64 }).notNull(),
    costCents: int("cost_cents").notNull().default(0),
    ts: datetime("ts").notNull(),
  },
  (t) => [index("agent_decisions_ts_idx").on(t.ts)],
);

// ── Subscribers (dormant paywall plumbing) ──────────────────────────────────
export const subscribers = mysqlTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  tier: varchar("tier", { length: 16 }).notNull().default("free"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 64 }),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
