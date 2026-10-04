/**
 * Formatting + spread color rules (design.md §2).
 * Spread color coding: < 3.0pt -> text-secondary; 3.0-6.9pt -> text-primary;
 * >= 7.0pt -> accent. Color is information, not decoration.
 */

export type SpreadTone = 'secondary' | 'primary' | 'accent'

export function spreadTone(spread: number): SpreadTone {
  if (spread >= 7.0) return 'accent'
  if (spread >= 3.0) return 'primary'
  return 'secondary'
}

const TONE_CLASS: Record<SpreadTone, string> = {
  secondary: 'text-secondary',
  primary: 'text-primary',
  accent: 'text-accent',
}

/** Tailwind text color class for a spread value, per the §2 rule table. */
export function spreadColorClass(spread: number): string {
  return TONE_CLASS[spreadTone(spread)]
}

/** Implied probability quote: 62 -> "62.0¢" */
export function formatPrice(price: number): string {
  return `${price.toFixed(1)}\u00A2`
}

/** Spread in points: 7 -> "+7.0pt" */
export function formatSpread(spread: number): string {
  return `+${spread.toFixed(1)}pt`
}

/** Confidence 0-1 -> "94.0%" */
export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`
}

/** ISO timestamp -> "2025-12-03 14:32 UTC" */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

/** Thousands separator for counters: 1283 -> "1,283" */
export function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}
