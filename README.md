# terminal.igniise.com

Cross-venue market intelligence terminal quantifying disagreement between regulated prediction markets. For every matched event, Igniise compares the implied probability on Polymarket against the implied probability on Kalshi and publishes the discrepancy in points, with a public audit log of every pairing decision.

Igniise is an independent intelligence practice. Nothing on this site constitutes investment advice, a solicitation, or an offer to transact in event contracts.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS with a two-register token system (paper / terminal)
- GSAP + ScrollTrigger (landing animation)
- Hono + tRPC + Drizzle ORM (server; MySQL in production)

## Routes

- `/` — manifesto landing
- `/terminal` — cross-venue discrepancy grid
- `/methodology` — methodology and audit log

## Development

```bash
npm install
npm run dev
```

## Compliance framing

Implied probabilities are venue quotes, not forecasts. Banned vocabulary across the site: bet, betting, wager, gamble, gambling, odds, sportsbook, casino. Required framing: implied probability, cross-venue discrepancy, spread (in points), regulated prediction market, event contract venue, resolution, verification, audit.
