export type Category = 'FED_RATES' | 'CPI' | 'ELECTIONS' | 'CRYPTO'

export type VerificationBadge = 'verified' | 'auto-matched'

export interface Pair {
  id: string
  event: string
  category: Category
  venueA: 'Polymarket'
  venueB: 'Kalshi'
  /** Implied probability in cents (0-100) at venue A */
  priceA: number
  /** Implied probability in cents (0-100) at venue B */
  priceB: number
  /** Absolute cross-venue spread in points */
  spread: number
  badge: VerificationBadge
  resolutionNote?: string
  /** Last 24 hourly spread samples, oldest first */
  spark: number[]
}

export interface AgentDecision {
  /** ISO 8601 UTC timestamp */
  ts: string
  action:
    | 'PAIR_PROPOSED'
    | 'PAIR_VERIFIED'
    | 'PAIR_REJECTED'
    | 'SPREAD_LOGGED'
    | 'RESOLUTION_SCORED'
  pair: string
  /** Model confidence, 0-1 */
  confidence: number
  reasoning: string
}
