import { z } from "zod";
import { TERMINAL_CATEGORIES } from "@contracts/terminal";
import type { AgentLogEntry, PairDetail, TerminalFeed, TerminalStats } from "@contracts/terminal";
import { createRouter, publicQuery } from "./middleware";
import { getAgentLog, getPairDetail, getTerminalFeed, getTerminalStats } from "./queries/terminal";

const EMPTY_FEED: TerminalFeed = { pairs: [], dataAsOf: new Date(0).toISOString() };
const ZERO_STATS: TerminalStats = { pairsTracked: 0, discrepanciesLogged: 0, resolutionAccuracy: 0 };

/**
 * The terminal API is read-only and public. A database outage must never
 * surface as a 500 to the client — we degrade to empty payloads instead.
 */
export const terminalRouter = createRouter({
  feed: publicQuery
    .input(z.object({ category: z.enum(TERMINAL_CATEGORIES).optional() }).optional())
    .query(async ({ input }): Promise<TerminalFeed> => {
      try {
        return await getTerminalFeed(input?.category);
      } catch (err) {
        console.error("[terminal.feed] query failed, serving empty feed:", err);
        return { ...EMPTY_FEED, dataAsOf: new Date().toISOString() };
      }
    }),

  stats: publicQuery.query(async (): Promise<TerminalStats> => {
    try {
      return await getTerminalStats();
    } catch (err) {
      console.error("[terminal.stats] query failed, serving zeroed stats:", err);
      return ZERO_STATS;
    }
  }),

  pairDetail: publicQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        range: z.enum(["7d", "30d", "90d"]).default("30d"),
      }),
    )
    .query(async ({ input }): Promise<PairDetail | null> => {
      try {
        return await getPairDetail(input.id, input.range);
      } catch (err) {
        console.error("[terminal.pairDetail] query failed:", err);
        return null;
      }
    }),

  agentLog: publicQuery
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }).optional())
    .query(async ({ input }): Promise<AgentLogEntry[]> => {
      try {
        return await getAgentLog(input?.limit ?? 50);
      } catch (err) {
        console.error("[terminal.agentLog] query failed, serving empty log:", err);
        return [];
      }
    }),
});
