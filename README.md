# igniise terminal

*Two markets. Same event. Different truths.*

A cross-venue market intelligence terminal that quantifies disagreement between regulated prediction markets (Polymarket vs Kalshi) on the same underlying events. It detects cross-venue discrepancies in implied probability, logs them, charts the spread over time, and maintains a public audit trail of every automated decision.

**igniise is an independent intelligence practice.**

## Surfaces

| Route | What it is |
|---|---|
| `/` | Manifesto: one scroll-length editorial argument (hook, mechanism, live credibility counters) |
| `/terminal` | Dense discrepancy grid: event, venue prices, spread, verification badge, sparkline, spread-over-time detail drawer |
| `/methodology` | Verification pipeline, data sources, public agent decision log, limitations |

## Stack

React 19 + TypeScript + Vite · Tailwind CSS · GSAP (+ ScrollTrigger, @gsap/react) · Lenis · Motion · Hono + tRPC 11 · Drizzle ORM + MySQL · Zod-validated poller for Polymarket Gamma / Kalshi public APIs.

## Design system

Warm off-black (`#0E0D0B`), bronze-amber accent (`#C9963F`), Newsreader display serif (manifesto only), Geist UI sans, Geist Mono for all numerals. All-sharp shape lock. Full spec: [`docs/build-spec.md`](docs/build-spec.md).

## Data integrity contract

The public site reads only from the database cache. If venue APIs fail or schemas drift, the poller fails loudly in logs while the site keeps serving the last verified data with an honest staleness indicator. The terminal never goes dark because an upstream dependency did.

## Setup

```bash
npm install
cp .env.example .env       # fill DATABASE_URL
python3 scripts/generate_assets.py   # regenerates public/*.png (binary assets are not stored in git)
npm run db:push
npx tsx db/seed.ts
npm run dev
```

`package-lock.json` is intentionally not tracked in this snapshot; `npm install` regenerates it. The poller (`scripts/poll.ts`) is idempotent and safe to run on any cron schedule.

## Compliance framing

This project publishes cross-venue pricing observations for informational purposes. Nothing on this site constitutes investment advice, a solicitation, or an offer to transact in event contracts. Copy law is enforced in the design system: no betting vocabulary, no profit promises, ever.

*Not managed. Engineered.*
