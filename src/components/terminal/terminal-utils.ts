import type { Pair } from '@/lib/types'
import type {
  DiscrepancyEntry,
  PairDetail,
  SpreadPoint,
  SpreadRange,
} from '@contracts/terminal'

/**
 * Terminal-local derivations. Everything here is deterministic (seeded PRNG,
 * id hashing): the mock fallback never calls Math.random().
 */

export type CategoryFilter = 'ALL' | Pair['category']
export type SortKey = 'SPREAD' | 'UPDATED' | 'EVENT' | 'DELTA'
export type Density = 'comfort' | 'compact'

/** Grid row: the feed pair plus derived 24h delta and per-row update time. */
export interface GridPair extends Pair {
  /** Change in spread across the last 24 hourly samples, signed points */
  delta24h: number
  /** ISO timestamp of this row's last confirmed quote */
  updatedAt: string
}

export const CATEGORY_CHIPS: { key: CategoryFilter; label: string }[] = [
  { key: 'ALL', label: 'ALL' },
  { key: 'FED_RATES', label: 'FED/RATES' },
  { key: 'CPI', label: 'CPI/INFLATION' },
  { key: 'ELECTIONS', label: 'ELECTIONS' },
  { key: 'CRYPTO', label: 'CRYPTO' },
]

export const SORT_CYCLE: SortKey[] = ['SPREAD', 'UPDATED', 'EVENT']

export const SORT_LABEL: Record<SortKey, string> = {
  SPREAD: 'SPREAD',
  UPDATED: 'UPDATED',
  EVENT: 'EVENT',
  DELTA: '24H Δ',
}

export const SORT_DIRECTION: Record<SortKey, '↓' | '↑'> = {
  SPREAD: '↓',
  UPDATED: '↓',
  EVENT: '↑',
  DELTA: '↓',
}

/** Stable 32-bit hash of a pair id (FNV-1a). */
export function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Derive 24h delta (from the hourly spark series) and a per-row quote time. */
export function enrichPair(pair: Pair, dataAsOf: string): GridPair {
  const spark = pair.spark
  const delta24h =
    spark.length >= 2 ? round1(spark[spark.length - 1] - spark[0]) : 0
  const offsetMin = hashId(pair.id) % 10
  const updatedAt = new Date(
    new Date(dataAsOf).getTime() - offsetMin * 60_000,
  ).toISOString()
  return { ...pair, delta24h, updatedAt }
}

export function sortPairs(rows: GridPair[], key: SortKey): GridPair[] {
  const copy = [...rows]
  switch (key) {
    case 'SPREAD':
      return copy.sort((a, b) => b.spread - a.spread)
    case 'UPDATED':
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    case 'EVENT':
      return copy.sort((a, b) => a.event.localeCompare(b.event))
    case 'DELTA':
      return copy.sort((a, b) => Math.abs(b.delta24h) - Math.abs(a.delta24h))
  }
}

/* ---- UTC time formatting (mono readouts) ---- */

const MONTHS_UPPER = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]
const MONTHS_TITLE = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const pad = (n: number) => String(n).padStart(2, '0')

/** "14:32" */
export function formatClock(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

/** "14:32:07" */
export function formatClockSeconds(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

/** "NOV 18" */
export function formatDayUpper(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS_UPPER[d.getUTCMonth()]} ${d.getUTCDate()}`
}

/** "Nov 18" */
export function formatDayTitle(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS_TITLE[d.getUTCMonth()]} ${d.getUTCDate()}`
}

/** "NOV 18 14:00" */
export function formatChartStamp(iso: string): string {
  return `${formatDayUpper(iso)} ${formatClock(iso)}`
}

/** Signed points delta: 1.5 -> "+1.5", -0.5 -> "-0.5" (plain hyphen-minus). */
export function formatDelta(n: number): string {
  const v = Math.abs(n) < 0.05 ? 0 : n
  return `${v >= 0 ? '+' : '-'}${Math.abs(v).toFixed(1)}`
}

/**
 * Deterministic fallback pair detail, synthesized from the local mock row.
 * Used only when the live pairDetail query is unreachable: the drawer never
 * renders empty or crashed, and the staleness readout shows the mock snapshot
 * timestamp honestly.
 */
export function buildFallbackDetail(
  pair: Pair,
  range: SpreadRange,
  dataAsOf: string,
): PairDetail {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const stepHours = range === '7d' ? 3 : range === '30d' ? 6 : 12
  const n = Math.max(2, Math.round((days * 24) / stepHours))
  const rand = mulberry32(hashId(pair.id) + days * 7919)
  const end = new Date(dataAsOf).getTime()

  // Random-walk backwards from the current quotes so the series always
  // terminates exactly at the pair's live values.
  const a: number[] = new Array(n)
  const b: number[] = new Array(n)
  a[n - 1] = pair.priceA
  b[n - 1] = pair.priceB
  for (let i = n - 2; i >= 0; i--) {
    a[i] = clamp(a[i + 1] + (rand() - 0.5) * 2.4, 0.5, 99.5)
    b[i] = clamp(b[i + 1] + (rand() - 0.5) * 2.4, 0.5, 99.5)
  }
  const history: SpreadPoint[] = a.map((v, i) => ({
    ts: new Date(end - (n - 1 - i) * stepHours * 3_600_000).toISOString(),
    priceA: round1(v),
    priceB: round1(b[i]),
    spread: round1(Math.abs(v - b[i])),
  }))

  const h = hashId(pair.id)
  const discrepancies: DiscrepancyEntry[] = [
    {
      id: 1,
      spreadPoints: round1(Math.max(0.5, pair.spread - 1.5)),
      direction: 'polymarket',
      openedAt: new Date(end - (2 + (h % 3)) * 86_400_000).toISOString(),
      peakedAt: null,
      closedAt: null,
      maxSpread: null,
    },
  ]
  if (pair.badge === 'verified') {
    discrepancies.push({
      id: 2,
      spreadPoints: round1(Math.max(0.5, pair.spread - 2.5)),
      direction: 'polymarket',
      openedAt: new Date(end - (9 + (h % 5)) * 86_400_000).toISOString(),
      peakedAt: new Date(end - (6 + (h % 3)) * 86_400_000).toISOString(),
      closedAt: new Date(end - (4 + (h % 3)) * 86_400_000).toISOString(),
      maxSpread: round1(pair.spread + 2.0),
    })
  }

  return {
    ...pair,
    dataAsOf,
    history,
    discrepancies,
  }
}

export interface LedgerDay {
  day: string
  entries: DiscrepancyEntry[]
}

/** Group ledger entries (newest first) into day chunks with sparse headers. */
export function groupLedger(entries: DiscrepancyEntry[]): LedgerDay[] {
  const sorted = [...entries].sort((x, y) => y.openedAt.localeCompare(x.openedAt))
  const days: LedgerDay[] = []
  for (const e of sorted) {
    const day = formatDayUpper(e.openedAt)
    const last = days[days.length - 1]
    if (last && last.day === day) last.entries.push(e)
    else days.push({ day, entries: [e] })
  }
  return days
}
