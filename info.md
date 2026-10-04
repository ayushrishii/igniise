# Research & Product Brief — igniise terminal

## Product
**terminal.igniise.com** — a cross-venue market intelligence terminal that quantifies disagreement between regulated prediction markets (Polymarket ↔ Kalshi). When two venues price the same underlying event differently, the terminal detects the discrepancy, logs it, charts the spread over time, and audits which venue resolved closer to the truth.

Tagline/manifesto hook: **"Two markets. Same event. Different truths."**
Exit line: *"igniise is an independent intelligence practice."*

## Audience (this picks the aesthetic)
Family office principals, private banking hiring managers, finance professors, quant-curious analysts. Institutional, compliance-minded, allergic to hype. The terminal must read like a Bloomberg/FactSet-grade instrument built by someone with taste — NOT a crypto bro dashboard, NOT a betting site, NOT generic SaaS.

## Framing Law (hard copy constraints — regulated-industry quiet constraint, overrides aesthetic preference)
- Never: bet, wager, gamble, odds, guaranteed profit, arbitrage-as-profit-promise, sportsbook
- Always: implied probability, cross-venue discrepancy, pricing inefficiency, information asymmetry, regulated prediction market, event contract venue
- Tone: calm, precise, engineered. No exclamation marks. No emojis.

## Pages (3 + shared shell)
1. **Manifesto (landing, `/`)** — one scroll-length, three screens: (1) the hook "Two markets. Same event. Different truths." (2) the mechanism — how disagreement is detected and audited (3) live credibility counters (pairs tracked, discrepancies logged, resolution accuracy) + "Enter the Terminal" CTA. Scroll-driven reveals.
2. **Terminal (`/terminal`)** — the product. Dense dark data grid: event name, venue A implied probability, venue B implied probability, spread (points), verification badge (verified ✓ / auto-matched), sparkline. Category filters: Fed/Rates, CPI/Inflation, Elections, Crypto. Row click → detail view with spread-over-time chart, per-venue prices, discrepancy ledger, resolution delta note. Staleness indicator ("data as of HH:MM UTC"). One visibly empty module slot labeled "MODULE 02 - RESERVED" (the shell is built to grow).
3. **Methodology & Audit Log (`/methodology`)** — the receipts. How pairs are verified (automated discovery, human verification, resolution-rule audit per pair), public agent decision log (action, confidence, reasoning, timestamp), data sources, limitations. This page converts skeptics.

## Aesthetic signals (from the operator's chosen design frameworks)
- Dark terminal shell, high information density, warm-neutral accent (amber/bronze family — institutional, not neon), monospace for numerals/data, refined serif or grotesque for display type on the manifesto.
- taste-skill ("design-taste-frontend") governs anti-slop discipline: full ruleset at /mnt/agents/output/design/refs/taste-skill.md — NOTE it self-scopes to landing pages; apply its typography/spacing/variance principles to the manifesto fully, and its density/type discipline to the terminal (product UI).
- GSAP official agent patterns at /mnt/agents/output/design/refs/gsap-core.md, gsap-react.md, gsap-scrolltrigger.md — canonical patterns only: timelines for sequencing, ScrollTrigger scrub reveals on the manifesto, useGSAP + gsap.context() cleanup in React, transforms over layout props.
- No blue-purple gradients. No glassmorphism clichés. No Google-style design. Whitespace and hairline rules over cards-everywhere.

## Realistic data context
The terminal displays tracked market pairs like: "Fed December rate decision", "US CPI YoY - November print", "Presidential approval rating", "BTC above $150k by year-end". Venue prices as implied probabilities (e.g. Polymarket 62¢ / Kalshi 55¢ → 7.0pt spread). Spreads in the 1–12pt range are realistic. Verification badges: verified ✓ (hand-audited) vs auto-matched (agent-approved).
