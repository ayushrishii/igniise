import type { AgentDecision, Pair } from './types'

/**
 * Mock data layer. The backend replaces this module; every surface
 * (manifesto counters, ticker, terminal grid, audit log) reads from here.
 * Values are deterministic: seeded PRNG, no Math.random().
 */

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 24 hourly spread samples drifting around the current spread. */
function sparkFor(spread: number, seed: number): number[] {
  const rand = mulberry32(seed)
  const out: number[] = []
  let v = Math.max(0.5, spread - 2 + rand() * 2)
  for (let i = 0; i < 24; i++) {
    v += (rand() - 0.48) * 0.9
    v = Math.max(0.4, Math.min(14, v))
    out.push(Number(v.toFixed(1)))
  }
  out[23] = spread
  return out
}

export const PAIRS: Pair[] = [
  {
    id: 'fed-dec-25bp',
    event: 'Fed December rate decision: 25bp cut',
    category: 'FED_RATES',
    venueA: 'Polymarket',
    venueB: 'Kalshi',
    priceA: 62.0,
    priceB: 55.0,
    spread: 7.0,
    badge: 'verified',
    resolutionNote: 'Both venues resolve against the FOMC statement, December meeting.',
    spark: sparkFor(7.0, 101),
  },
  {
    id: 'fed-jan-hold',
    event: 'Fed January meeting: rates unchanged',
    category: 'FED_RATES',
    venueA: 'Polymarket',
    venueB: 'Kalshi',
    priceA: 48.5,
    priceB: 52.0,
    spread: 3.5,
    badge: 'verified',
    resolutionNote: 'Resolves on the January FOMC statement.',
    spark: sparkFor(3.5, 102),
  },
  {
    id: 'fed-2026-easing',
    event: 'Cumulative Fed easing in 2026 above 75bp',
    category: 'FED_RATES',
    venueA: 'Polymarket',
    venueB: 'Kalshi',
    priceA: 34.0,
    priceB: 31.0,
    spread: 3.0,
    badge: 'auto-matched',
    spark: sparkFor(3.0, 103),
  },
  {
    id: 'cpi-nov-yoy',
    event: 'US CPI YoY, November print above 3.0%',
    category: 'CPI',
    venueA: 'Polymarket',
    venueB: 'Kalshi',
    priceA: 41.5,
    priceB: 38.0,
    spread: 3.5,
    badge: 'verified',
    resolutionNote: 'Both venues resolve against the BLS November CPI release.',
    spark: sparkFor(3.5, 104),
  },
  {
    id: 'cpi-core-dec',
    event: 'US core CPI MoM, December above 0.3%',
    category: 'CPI',
    venueA: 'Polymarket',
    venueB: 'Kalshi',
    priceA: 55.0,
    priceB: 52.5,
    spread: 2.5,
    badge: 'auto-matched',
    spark: sparkFor(2.5, 105),
  },
  {
    id: 'pce-q4',
    event: 'Core PCE YoY, Q4 print above 2.8%',
    category: 'CPI',
    venueA: 'Polymarket',
    venueB: 'Kalshi',
    priceA: 47.0,
    priceB: 49.5,
    spread: 2.5,
    badge: 'verified',
    resolutionNote: 'Resolves against the BEA core PCE release for the Q4 reference month.',
    spark: sparkFor(2.5, 106),
  },
  {
    id: 'approval-yearend',
    event: 'Presidential approval rating above 45% at year-end',
    category: 'ELECTIONS',
    venueA: 'Polymarket',
    venueB: 'Kalshi',
    priceA: 38.0,
    priceB: 33.5,
    spread: 4.5,
    badge: 'verified',
    resolutionNote: 'Both venues resolve against the same polling average on December 31.',
    spark: sparkFor(4.5, 107),
  },
  {
    id: 'senate-2026',
    event: 'Senate control after the 2026 midterms',
    category: 'ELECTIONS',
    venueA: 'Polymarket',
    venueB: 'Kalshi',
    priceA: 52.0,
    priceB: 47.0,
    spread: 5.0,
    badge: 'verified',
    spark: sparkFor(5.0, 108),
  },
  {
    id: 'shutdown-mar',
    event: 'Federal government shutdown before March 2026',
    category: 'ELECTIONS',
    venueA: 'Polymarket',
    venueB: 'Kalshi',
    priceA: 29.5,
    priceB: 27.0,
    spread: 2.5,
    badge: 'auto-matched',
    spark: sparkFor(2.5, 109),
  },
  {
    id: 'btc-150k',
    event: 'BTC above $150,000 by year-end',
    category: 'CRYPTO',
    venueA: 'Polymarket',
    venueB: 'Kalshi',
    priceA: 27.5,
    priceB: 18.5,
    spread: 9.0,
    badge: 'verified',
    resolutionNote: 'Both venues resolve against the same spot reference at December 31, 23:59 UTC.',
    spark: sparkFor(9.0, 110),
  },
  {
    id: 'eth-6k',
    event: 'ETH above $6,000 by year-end',
    category: 'CRYPTO',
    venueA: 'Polymarket',
    venueB: 'Kalshi',
    priceA: 22.0,
    priceB: 19.0,
    spread: 3.0,
    badge: 'auto-matched',
    spark: sparkFor(3.0, 111),
  },
  {
    id: 'btc-etf-dec',
    event: 'BTC ETF net inflows positive in December',
    category: 'CRYPTO',
    venueA: 'Polymarket',
    venueB: 'Kalshi',
    priceA: 66.5,
    priceB: 55.5,
    spread: 11.0,
    badge: 'verified',
    resolutionNote: 'Resolves against aggregate issuer flow reporting for December.',
    spark: sparkFor(11.0, 112),
  },
]

export const AGENT_DECISIONS: AgentDecision[] = [
  {
    ts: '2025-12-03T14:32:00Z',
    action: 'SPREAD_LOGGED',
    pair: 'Fed December rate decision: 25bp cut',
    confidence: 0.99,
    reasoning: 'Quotes refreshed at both venues. Spread widened to 7.0pt, logged to the discrepancy grid.',
  },
  {
    ts: '2025-12-03T14:02:00Z',
    action: 'SPREAD_LOGGED',
    pair: 'BTC above $150,000 by year-end',
    confidence: 0.99,
    reasoning: 'Hourly sample recorded. Polymarket quote moved 1.5pt while Kalshi held, spread now 9.0pt.',
  },
  {
    ts: '2025-12-03T11:47:00Z',
    action: 'PAIR_VERIFIED',
    pair: 'BTC ETF net inflows positive in December',
    confidence: 0.97,
    reasoning: 'Human audit confirmed both contracts resolve against aggregate issuer flow reporting. Pair promoted to verified.',
  },
  {
    ts: '2025-12-03T09:15:00Z',
    action: 'PAIR_PROPOSED',
    pair: 'US core CPI MoM, December above 0.3%',
    confidence: 0.91,
    reasoning: 'Matcher found candidate contracts on both venues with near-identical resolution text. Queued for audit.',
  },
  {
    ts: '2025-12-03T08:00:00Z',
    action: 'SPREAD_LOGGED',
    pair: 'US CPI YoY, November print above 3.0%',
    confidence: 0.99,
    reasoning: 'Hourly sample recorded. Spread steady at 3.5pt across the last six observations.',
  },
  {
    ts: '2025-12-02T22:30:00Z',
    action: 'SPREAD_LOGGED',
    pair: 'Senate control after the 2026 midterms',
    confidence: 0.99,
    reasoning: 'Kalshi quote repriced after the session close. Spread recorded at 5.0pt.',
  },
  {
    ts: '2025-12-02T18:12:00Z',
    action: 'PAIR_REJECTED',
    pair: 'Fed speakers: December press conference wording',
    confidence: 0.62,
    reasoning: 'Candidate contracts used different resolution sources. Rejected, resolution rules must be identical.',
  },
  {
    ts: '2025-12-02T16:05:00Z',
    action: 'SPREAD_LOGGED',
    pair: 'Presidential approval rating above 45% at year-end',
    confidence: 0.99,
    reasoning: 'Hourly sample recorded. Both quotes moved together, spread unchanged at 4.5pt.',
  },
  {
    ts: '2025-12-02T13:40:00Z',
    action: 'RESOLUTION_SCORED',
    pair: 'US CPI YoY, October print above 3.1%',
    confidence: 1.0,
    reasoning: 'Event resolved. The wider venue closed 4.0pt of the 5.5pt spread into the print. Scored to the public log.',
  },
  {
    ts: '2025-12-02T10:22:00Z',
    action: 'PAIR_VERIFIED',
    pair: 'Fed January meeting: rates unchanged',
    confidence: 0.98,
    reasoning: 'Audit confirmed both venues resolve on the January FOMC statement. Pair promoted to verified.',
  },
  {
    ts: '2025-12-02T07:58:00Z',
    action: 'SPREAD_LOGGED',
    pair: 'ETH above $6,000 by year-end',
    confidence: 0.99,
    reasoning: 'Hourly sample recorded. Spread narrowed to 3.0pt from 3.6pt.',
  },
  {
    ts: '2025-12-01T21:14:00Z',
    action: 'PAIR_PROPOSED',
    pair: 'Cumulative Fed easing in 2026 above 75bp',
    confidence: 0.87,
    reasoning: 'Matcher aligned contract series across venues. Settlement wording differs in one clause, flagged for audit.',
  },
  {
    ts: '2025-12-01T17:33:00Z',
    action: 'SPREAD_LOGGED',
    pair: 'Federal government shutdown before March 2026',
    confidence: 0.99,
    reasoning: 'Hourly sample recorded. Spread steady at 2.5pt.',
  },
  {
    ts: '2025-12-01T15:01:00Z',
    action: 'RESOLUTION_SCORED',
    pair: 'BTC above $140,000 in November',
    confidence: 1.0,
    reasoning: 'Event resolved negative. Neither venue held a meaningful edge at the final observation. Scored to the public log.',
  },
  {
    ts: '2025-12-01T12:45:00Z',
    action: 'SPREAD_LOGGED',
    pair: 'Fed December rate decision: 25bp cut',
    confidence: 0.99,
    reasoning: 'Polymarket repriced after the afternoon session. Spread moved to 6.6pt, later widened.',
  },
  {
    ts: '2025-12-01T09:30:00Z',
    action: 'PAIR_VERIFIED',
    pair: 'Presidential approval rating above 45% at year-end',
    confidence: 0.96,
    reasoning: 'Audit confirmed both contracts resolve against the same polling average on the same date. Pair promoted.',
  },
  {
    ts: '2025-11-30T20:10:00Z',
    action: 'SPREAD_LOGGED',
    pair: 'BTC above $150,000 by year-end',
    confidence: 0.99,
    reasoning: 'Weekend liquidity thinned at both venues. Spread recorded at 8.5pt with a staleness flag cleared on refresh.',
  },
  {
    ts: '2025-11-30T14:26:00Z',
    action: 'PAIR_REJECTED',
    pair: 'ETH staking yield above 4% in Q1',
    confidence: 0.58,
    reasoning: 'Only one venue lists the contract. No cross-venue pair possible, rejected.',
  },
  {
    ts: '2025-11-30T08:00:00Z',
    action: 'SPREAD_LOGGED',
    pair: 'Core PCE YoY, Q4 print above 2.8%',
    confidence: 0.99,
    reasoning: 'Hourly sample recorded. Spread steady at 2.5pt.',
  },
  {
    ts: '2025-11-29T16:52:00Z',
    action: 'PAIR_VERIFIED',
    pair: 'Senate control after the 2026 midterms',
    confidence: 0.95,
    reasoning: 'Audit confirmed identical resolution criteria and settlement dates. Pair promoted to verified.',
  },
]

/** Live counters read by the manifesto and the terminal summary module. */
export const TERMINAL_STATS = {
  pairsTracked: 47,
  discrepanciesLogged: 1283,
  widerVenueClosedGapPct: 71.4,
  dataAsOf: '2025-12-03T14:32:00Z',
}

/** Hero ticker items, derived from the widest tracked spreads. */
export interface TickerItem {
  pairId: string
  label: string
}

export const TICKER_ITEMS: TickerItem[] = [
  { pairId: 'fed-dec-25bp', label: 'FED DECISION +7.0PT' },
  { pairId: 'cpi-nov-yoy', label: 'CPI NOV +3.5PT' },
  { pairId: 'btc-150k', label: 'BTC YEAR-END +9.0PT' },
  { pairId: 'approval-yearend', label: 'APPROVAL +4.5PT' },
]
