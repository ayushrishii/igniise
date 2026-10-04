import { createRouter, publicQuery } from "./middleware";
import { terminalRouter } from "./terminalRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  terminal: terminalRouter,
});

export type AppRouter = typeof appRouter;
