# plan.md — terminal.igniise.com Build

**Spec of record:** docs/build-spec.md (ratified Q1–Q10)
**Repo:** github.com/ayushrishii/igniise (clone → work → push)
**Stack:** React 19 + Vite + Hono + tRPC + Drizzle + MySQL (sandbox-pinned equivalent of the ratified Next.js/Neon monolith: one repo, one deploy, server DB, cron poller)

## Stage 0 — Workspace
- Clone ayushrishii/igniise; commit spec + plan as founding docs

## Stage 1 — Data spine
- Drizzle schema (markets_raw, pairs, snapshots, discrepancies, resolutions, agent_decisions, subscribers); seed (12 curated pairs + 2 retired); poller (Polymarket Gamma + Kalshi, Zod drift validation, idempotent); cached public tRPC feed with graceful degradation

## Stage 2 — Design
- Pro_Designer subagent → design.md + per-page designs (taste-skill dials: manifesto 7/7/3, terminal 4/4/9, methodology 5/4/6)

## Stage 3 — Scaffold
- Manifesto landing + shared infra (TopBar, Footer, Layout, Badge, Sparkline, Button, format/types/data libs) + generated assets

## Stage 4 — Backend graft
- Hono + tRPC + Drizzle graft (db feature), terminal router: feed, stats, pairDetail, agentLog

## Stage 5 — Parallel page agents
- terminal branch: discrepancy grid, filters, detail drawer, spread charts
- methodology branch: verification pipeline, public audit log

## Stage 6 — Merge, build, version, push
- Octopus → sequential merges, tsc + vite build gate, platform version saved, push to GitHub
