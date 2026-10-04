# terminal.igniise.com — Founding Build Specification

**Version:** 1.0 · **Date:** 2026-10-04 · **Status:** Ratified (cross-examination complete, Q1–Q10 resolved)

> *igniise is an independent intelligence practice.*

---

## 1. Product Definition

A cross-venue market intelligence terminal that quantifies disagreement between regulated prediction markets. It detects when Polymarket and Kalshi price the same underlying event differently, records the discrepancy, tracks which venue resolved closer to the truth, and publishes the audited track record.

**One sentence for the manifesto:** Two markets. Same event. Different truths. This terminal measures the gap.

**What it is not:** a betting tool, a betting-adjacent tool, or a trading signal service. It is an information-asymmetry detection system.

### Framing Law (compliance-aware language — permanent, applies to all copy)

| Never say | Always say |
|---|---|
| bet, wager, gamble | position, implied probability |
| arbitrage (as profit promise) | cross-venue discrepancy |
| guaranteed profit / free money | pricing inefficiency, information asymmetry |
| odds | implied probability |
| sportsbook / betting market | regulated prediction market / event contract venue |

Voice Codex governs all external-facing copy. The terminal is the flagship store: it doesn't need to turn a profit, it needs to make the brand undeniable.

---

## 2. Decisions Register

| # | Branch | Decision |
|---|---|---|
| 1 | Domain | Prediction market discrepancy terminal (Polymarket ↔ Kalshi) |
| 2 | Scope | ONE wedge in a terminal shell built to accept future modules |
| 3 | Design language | taste-skill (`design-taste-frontend`, high VISUAL_DENSITY) + official gsap-skills patterns |
| 4 | Memory | Live + accumulated history now; resolution tracking schema at day one, shipped v1.1 |
| 5 | Hosting | terminal.igniise.com — subdomain via Squarespace DNS CNAME → deploy target |
| 6 | Matching | Hybrid: hand-verified seed pairs + LLM-assisted discovery with tiered autonomy |
| 7 | Supervision | Tiered autonomy + self-audit digest; failure detection (not self-repair); public site never depends on agent success |
| 8 | Transparency | "verified" (hand-audited) vs "auto-matched" (agent-approved) badges, publicly visible |
| 9 | Monetization | Free at launch; brand funnel + staged freemium; paywall plumbing in schema; Pro tier is a feature flag, not a rebuild; NO affiliate/referral links ever |
| 10 | Employment | No employer disclosure required for the free phase; policy review checkbox reactivates the moment the Pro tier flag flips |
| 11 | Funnel | Compressed manifesto (≤3 screens) → terminal; two exits only: Methodology & Audit Log, and the igniise line. No popups, no email capture forms |
| 12 | Timeline | No fixed date; live by 2026-12-31 |
| 13 | Stack | One repo, one deploy, one dashboard. Sandbox build pins React+Vite+Hono+tRPC+Drizzle+MySQL; portable to Next.js+Vercel+Neon (the ratified production shape) since the schema/poller are framework-agnostic |
| 14 | Launch universe | Fed/rate decisions, CPI & inflation prints, US elections, crypto price levels. Sports and pop culture excluded from auto-live; agent may discover but routes to review queue |

---

## 3. Architecture

```
React SPA (Vite)  ──►  Hono + tRPC API  ──►  Drizzle ORM  ──►  MySQL
     ▲                      ▲
     │                      │
Cached public feed    Cron poller (scripts/poll.ts)
(graceful degradation)   Polymarket Gamma + Kalshi public APIs
```

**Non-negotiable property — graceful degradation:** the public site reads only from the database cache (with a local mock layer as final fallback). If Polymarket changes its schema, if the LLM call fails, if cron misses a beat — visitors see the last verified data with an honest staleness indicator. The site can never go dark because an upstream dependency sneezed.

---

## 4. Database Schema (Drizzle)

| Table | Purpose | Key fields |
|---|---|---|
| `markets_raw` | Latest normalized pull per venue | venue, venue_market_id, title, category, close_time, resolution_rules, raw_json, pulled_at |
| `pairs` | The registry — core asset | polymarket_id, kalshi_id, confidence, status (seed/auto/queued/retired), badge (verified/auto-matched), resolution_note, created_by, approved_at |
| `snapshots` | Price history per pair leg | pair_id, venue, price, volume, ts |
| `discrepancies` | Logged gap events | pair_id, spread_points, direction, opened_at, peaked_at, closed_at, max_spread |
| `resolutions` | Settlement outcomes (v1.1 activation) | pair_id, winning_outcome, settled_at, venue_closer_to_truth |
| `agent_decisions` | The audit trail — public | action, pair_id, confidence, reasoning, model, cost_cents, ts |
| `subscribers` | Paywall plumbing — dormant until v1.1 Pro | email, tier (free/pro), stripe_customer_id |

The `agent_decisions` table is load-bearing: it powers the Methodology page and is the answer to "how do you know you're comparing apples to apples?" — automated discovery, human verification, resolution-rule audit per pair.

---

## 5. The Agent Loop (tiered autonomy)

**Poller** (cron, every 5–15 min): pull both venue catalogs → normalize → upsert `markets_raw` → snapshot live pairs → detect/log discrepancies → validate schema (fail loudly to operator, silently to visitors).

**Discovery agent** (daily, v1.1): scan new markets → candidate pairs → LLM scores confidence →
- ≥ 0.90 + identical resolution source → **auto-approve**, badge `auto-matched`
- 0.60–0.89 → **review queue**, waits indefinitely, breaks nothing
- < 0.60 → discard, log

**Supervisor** (continuous + weekly): expiry watch, resolution-rule change detection, dead-pair retirement, poller health, staleness detection. **Failure detection and alerting — never self-repair.** Weekly self-audit digest: pairs approved / quarantined / retired, discrepancies logged, agent spend.

**Hard cost cap coded in:** the agent dies before the wallet does. Ceiling: $10/month; expected ~$2–5.

---

## 6. Frontend

**Manifesto (`/`)** — one scroll-length, three screens max:
1. The hook: *Two markets. Same event. Different truths.*
2. The mechanism: how disagreement is detected and audited
3. The credibility: live counters — pairs tracked, discrepancies logged, resolution accuracy
→ *Enter the Terminal.*

**Terminal (`/terminal`)** — high-density dark shell (taste-skill VISUAL_DENSITY 9):
- Discrepancy grid: event · venue A price · venue B price · spread · badge · sparkline
- Detail view per pair: spread-over-time chart, resolution delta note, discrepancy ledger
- Category filter: Fed/Rates · CPI/Inflation · Elections · Crypto
- Visible empty module slot (MODULE 02 - RESERVED) — the shell is built to grow

**Methodology & Audit Log (`/methodology`)** — the receipts. Public agent decision log. Converts skeptics.

**Motion (gsap-skills canonical patterns only):** timelines for sequencing, ScrollTrigger for manifesto reveals, `useGSAP` + `gsap.context()` cleanup in React, transforms over layout props. Motion serves density, never decorates for its own sake.

**Two exits only:** Methodology page · *igniise is an independent intelligence practice* → contact/LinkedIn.

---

## 7. Economics

| Item | Cost |
|---|---|
| Hosting + cron | $0 (free tier) |
| Database | $0 (free tier) |
| Domain | already owned (Squarespace) |
| LLM supervision | ~$2–5/mo, hard cap $10 |
| **Survival threshold** | **One $9–15/mo Pro subscriber covers everything** |

Pro tier (v1.1, feature flag): real-time alerts (spread > X%), historical data, CSV/API export. Priced only after 6–8 weeks of audited track record exists to sell.

---

## 8. Build Phases (→ 2026-12-31)

1. **Data spine**: poller + DB + hand-verified seed pairs, ugly frontend. Prove numbers flow. ✅ (v1)
2. **Terminal UI**: taste-skill density, discrepancy grid, spread charts, detail views, badges. ✅ (v1)
3. **Manifesto + GSAP motion**: the polish layer that makes it feel expensive. ✅ (v1)
4. **Agentic supervision** (v1.1): discovery agent, tiered autonomy, supervisor, weekly digest. Autonomy bolts onto a *proven* pipeline — never before.

Ship gate: zero publicly visible mismatches on the seed set.

## 9. DNS (Squarespace → host)

1. Deploy project; add domain `terminal.igniise.com` in host settings.
2. Squarespace → Domains → igniise.com → DNS settings → add **CNAME**: host `terminal`, value per host (e.g. `cname.vercel-dns.com`).
3. Wait for propagation; TLS auto-issues. Root domain untouched.

## 10. Launch Checklist

- [x] Seed pairs with resolution delta notes
- [x] Staleness indicator + graceful degradation
- [x] Framing Law pass on every visible string
- [x] Methodology page live with agent_decisions feed
- [ ] Cost cap tripwire tested (v1.1 agent layer)
- [ ] DNS cutover verified
- [ ] Employer policy checkbox — dormant, reactivates at Pro tier flag

## 11. Scoreboard (how we know it worked)

1. **Uptime & integrity** — site alive, zero publicly visible mismatches. Non-negotiable floor.
2. **The compounding number** — discrepancies logged + resolution accuracy, live on the manifesto.
3. **One conversation** — one target-world human saying *"I looked at your terminal"* unprompted. One is success. Three is a triumph.

No pageview targets. No follower counts. *Not managed. Engineered.*
