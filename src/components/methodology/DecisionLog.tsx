import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { trpc } from '@/providers/trpc'
import { AGENT_DECISIONS, PAIRS } from '@/lib/data'
import type { AgentDecision } from '@/lib/types'
import { cn } from '@/lib/utils'
import { EASE_OUT } from './Reveal'

/**
 * Section 4: public agent decision log (methodology.md §4, design.md §5.7).
 * Day-grouped dense rows with sparse dividers, action filter chips with
 * counts, click-to-expand reasoning plus evidence links. Data comes from
 * trpc.terminal.agentLog; on query error or an empty payload the mock
 * decisions in src/lib/data.ts render instead, so the page never crashes.
 */

type FilterKey = 'ALL' | 'PROPOSED' | 'VERIFIED' | 'REJECTED' | 'SCORED'

const FILTERS: FilterKey[] = ['ALL', 'PROPOSED', 'VERIFIED', 'REJECTED', 'SCORED']

interface ActionMeta {
  label: string
  group: Exclude<FilterKey, 'ALL'> | 'LOGGED'
  className: string
}

const ACTION_META: Record<string, ActionMeta> = {
  PAIR_PROPOSED: { label: 'PROPOSED', group: 'PROPOSED', className: 'text-primary' },
  PAIR_VERIFIED: { label: 'VERIFIED', group: 'VERIFIED', className: 'text-accent' },
  PAIR_REJECTED: { label: 'REJECTED', group: 'REJECTED', className: 'text-muted' },
  SPREAD_LOGGED: { label: 'LOGGED', group: 'LOGGED', className: 'text-primary' },
  RESOLUTION_SCORED: { label: 'SCORED', group: 'SCORED', className: 'text-primary' },
}

const FALLBACK_META: ActionMeta = {
  label: 'LOGGED',
  group: 'LOGGED',
  className: 'text-primary',
}

interface LogEntry {
  key: string
  ts: string
  action: string
  pair: string
  confidence: number | null
  reasoning: string
}

const KNOWN_ACTIONS = new Set(Object.keys(ACTION_META))

function toEntry(
  raw: { ts: string; action: string; pair: string; confidence: number | null; reasoning: string },
  index: number,
): LogEntry {
  return {
    key: `${raw.ts}-${raw.action}-${index}`,
    ts: raw.ts,
    action: KNOWN_ACTIONS.has(raw.action) ? raw.action : 'SPREAD_LOGGED',
    pair: raw.pair,
    confidence: raw.confidence,
    reasoning: raw.reasoning,
  }
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const pad = (n: number) => String(n).padStart(2, '0')

/** ISO -> "NOV 18 14:02" (UTC, mono row timestamp) */
function rowTimestamp(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS[d.getUTCMonth()]} ${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

/** ISO -> day-group key "2025-11-18" */
function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** day key -> "NOV 18 2025" */
function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${MONTHS[m - 1]} ${pad(d)} ${y}`
}

interface DayGroup {
  key: string
  entries: LogEntry[]
}

function groupByDay(entries: LogEntry[]): DayGroup[] {
  const sorted = [...entries].sort((a, b) => b.ts.localeCompare(a.ts))
  const groups: DayGroup[] = []
  for (const entry of sorted) {
    const key = dayKey(entry.ts)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.entries.push(entry)
    else groups.push({ key, entries: [entry] })
  }
  return groups
}

function confidenceClass(confidence: number | null): string {
  if (confidence == null) return 'text-muted'
  return confidence >= 0.9 ? 'text-primary' : 'text-secondary'
}

function EvidenceLinks() {
  return (
    <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.1em]">
      <span className="text-muted">Evidence:</span>
      <a
        href="https://polymarket.com"
        target="_blank"
        rel="noopener"
        className="text-muted transition-colors duration-150 hover:text-accent"
      >
        polymarket.com
      </a>
      <a
        href="https://kalshi.com"
        target="_blank"
        rel="noopener"
        className="text-muted transition-colors duration-150 hover:text-accent"
      >
        kalshi.com
      </a>
    </div>
  )
}

function LogRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: LogEntry
  expanded: boolean
  onToggle: () => void
}) {
  const meta = ACTION_META[entry.action] ?? FALLBACK_META
  const detailId = `log-detail-${entry.key}`
  const match = PAIRS.find((p) => p.event === entry.pair)
  const reduced = useReducedMotion()

  return (
    <>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={onToggle}
        className="block w-full px-2 py-2 text-left transition-colors duration-150 hover:bg-inset md:grid md:h-9 md:grid-cols-[120px_110px_1fr_90px] md:items-center md:gap-x-3 md:py-0"
      >
        <span className="flex items-center justify-between md:contents">
          <span
            className={cn(
              'font-mono text-[11px] font-medium uppercase tracking-[0.1em] md:order-2',
              meta.className,
            )}
          >
            {meta.label}
          </span>
          <span
            className={cn(
              'font-mono text-[13px] tabular-nums md:order-4 md:text-right',
              confidenceClass(entry.confidence),
            )}
          >
            {entry.confidence == null ? '-' : entry.confidence.toFixed(2)}
          </span>
        </span>
        <span className="mt-0.5 flex items-baseline gap-3 md:mt-0 md:contents">
          <span className="shrink-0 font-mono text-[11px] text-muted md:order-1">
            {rowTimestamp(entry.ts)}
          </span>
          <span className="truncate font-sans text-[13px] text-secondary md:order-3">
            <span className="text-primary">{entry.pair}.</span> {entry.reasoning}
          </span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={detailId}
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-4 pt-1 md:pl-[242px]">
              <p className="max-w-[62ch] font-sans text-[13px] leading-[1.65] text-secondary">
                {entry.reasoning}
              </p>
              {match?.resolutionNote && (
                <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">
                  Resolution: {match.resolutionNote}
                </p>
              )}
              <EvidenceLinks />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function DayGroupBlock({
  group,
  first,
  expandedKey,
  onToggle,
}: {
  group: DayGroup
  first: boolean
  expandedKey: string | null
  onToggle: (key: string) => void
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      layout={reduced ? undefined : 'position'}
      exit={reduced ? undefined : { opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className={cn('border-t border-hairline pt-6', first ? 'mt-0' : 'mt-6')}
    >
      {reduced ? (
        <h3 className="px-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          {dayLabel(group.key)}
        </h3>
      ) : (
        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.4, once: true }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="px-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted"
        >
          {dayLabel(group.key)}
        </motion.h3>
      )}
      <ul className="mt-3">
        <AnimatePresence initial={false}>
          {group.entries.map((entry, i) => {
            // methodology.md §4: max 10 rows entrance-animated per group
            const animated = !reduced && i < 10
            const row = (
              <LogRow
                entry={entry}
                expanded={expandedKey === entry.key}
                onToggle={() => onToggle(entry.key)}
              />
            )
            return animated ? (
              <motion.li
                key={entry.key}
                layout="position"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                viewport={{ amount: 0.2, once: true }}
                transition={{ duration: 0.25, delay: i * 0.04, ease: EASE_OUT }}
              >
                {row}
              </motion.li>
            ) : (
              <motion.li
                key={entry.key}
                layout={reduced ? undefined : 'position'}
                exit={reduced ? undefined : { opacity: 0 }}
              >
                {row}
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </motion.div>
  )
}

export default function DecisionLog() {
  const query = trpc.terminal.agentLog.useQuery({ limit: 50 })
  const [filter, setFilter] = useState<FilterKey>('ALL')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  // Graceful degradation: API error, empty payload, or in-flight query all
  // fall back to the mock decisions so the audit log never renders blank.
  const entries = useMemo<LogEntry[]>(() => {
    const live = query.data
    if (live && live.length > 0) return live.map(toEntry)
    return AGENT_DECISIONS.map((d: AgentDecision, i) =>
      toEntry({ ...d, confidence: d.confidence }, i),
    )
  }, [query.data])

  const counts = useMemo(() => {
    const acc: Record<FilterKey, number> = {
      ALL: entries.length,
      PROPOSED: 0,
      VERIFIED: 0,
      REJECTED: 0,
      SCORED: 0,
    }
    for (const e of entries) {
      const group = (ACTION_META[e.action] ?? FALLBACK_META).group
      if (group !== 'LOGGED') acc[group] += 1
    }
    return acc
  }, [entries])

  const groups = useMemo(() => {
    const filtered =
      filter === 'ALL'
        ? entries
        : entries.filter(
            (e) => (ACTION_META[e.action] ?? FALLBACK_META).group === filter,
          )
    return groupByDay(filtered)
  }, [entries, filter])

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <h2 className="font-sans text-2xl font-medium tracking-tight text-primary md:text-3xl">
          Agent decision log
        </h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter log by action">
          {FILTERS.map((f) => {
            const active = filter === f
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f)}
                className={cn(
                  'h-8 border px-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition-colors duration-150',
                  active
                    ? 'border-accent bg-accent/[0.06] text-accent'
                    : 'border-hairline text-secondary hover:border-hairline-strong hover:text-primary',
                )}
              >
                {f}
                <span className="ml-1.5 text-muted">{counts[f]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        <AnimatePresence initial={false}>
          {groups.map((group, i) => (
            <DayGroupBlock
              key={group.key}
              group={group}
              first={i === 0}
              expandedKey={expandedKey}
              onToggle={(key) => setExpandedKey((cur) => (cur === key ? null : key))}
            />
          ))}
        </AnimatePresence>
        {groups.length === 0 && (
          <p className="border-t border-hairline pt-6 font-mono text-[11px] text-muted">
            No entries for this filter.
          </p>
        )}
      </div>

      <p className="mt-8 font-sans text-[12px] leading-[1.65] text-muted">
        Log entries are immutable once written. Corrections are appended,
        never edited.
      </p>
    </section>
  )
}
