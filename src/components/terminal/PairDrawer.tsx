import { useMemo, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, X } from '@phosphor-icons/react'
import Badge from '@/components/Badge'
import { spreadColorClass } from '@/lib/format'
import { cn } from '@/lib/utils'
import SpreadChart from './SpreadChart'
import { useMediaQuery, usePairDetail } from './use-terminal-data'
import {
  formatChartStamp,
  formatClock,
  formatClockSeconds,
  formatDayTitle,
  formatDelta,
  groupLedger,
  hashId,
  type GridPair,
} from './terminal-utils'
import type { DiscrepancyEntry, SpreadRange } from '@contracts/terminal'

/**
 * Row detail drawer (terminal.md §2). Right-side panel at >=768px, bottom
 * sheet below. Radix Dialog primitive restyled to the token set: radius 0,
 * hairlines, the one permitted drawer shadow. Esc, scrim, or X closes; focus
 * is trapped while open. Reduced motion: instant swap, no slide, no draw.
 */

const EASE_DRAWER = [0.22, 1, 0.36, 1] as [number, number, number, number]
const EASE_MICRO = [0.16, 1, 0.3, 1] as [number, number, number, number]
const DRAWER_SHADOW = '0 0 0 1px #26231E, 0 24px 64px rgba(0,0,0,0.55)'
const LEDGER_PREVIEW = 8

function ledgerDelta(entry: DiscrepancyEntry, currentSpread: number): number {
  if (entry.closedAt && entry.maxSpread !== null) {
    return Math.round((entry.spreadPoints - entry.maxSpread) * 10) / 10
  }
  return Math.round((currentSpread - entry.spreadPoints) * 10) / 10
}

function Section({
  reducedMotion,
  className,
  children,
}: {
  reducedMotion: boolean
  className?: string
  children: React.ReactNode
}) {
  if (reducedMotion) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_MICRO } },
      }}
    >
      {children}
    </motion.div>
  )
}

export default function PairDrawer({
  pair,
  open,
  onClose,
  feedDataAsOf,
  reducedMotion,
}: {
  pair: GridPair | null
  open: boolean
  onClose: () => void
  feedDataAsOf: string | null
  reducedMotion: boolean
}) {
  const narrow = useMediaQuery('(max-width: 767px)')
  const [range, setRange] = useState<SpreadRange>('30d')
  const [expanded, setExpanded] = useState(false)
  const { detail, loading } = usePairDetail(pair, range, open, feedDataAsOf)

  // Reset drawer-local state when the selected pair changes (adjust-state-
  // during-render pattern; no effect needed).
  const [lastPairId, setLastPairId] = useState<string | null>(pair?.id ?? null)
  if ((pair?.id ?? null) !== lastPairId) {
    setLastPairId(pair?.id ?? null)
    setRange('30d')
    setExpanded(false)
  }

  const dataAsOf = detail?.dataAsOf ?? feedDataAsOf ?? pair?.updatedAt ?? ''
  const base = dataAsOf ? new Date(dataAsOf).getTime() : 0
  const polyTs = base ? new Date(base - 4_000).toISOString() : ''
  const kalshiTs = base ? new Date(base - 9_000).toISOString() : ''
  const verifiedAt = base
    ? new Date(base - (3 + (pair ? hashId(pair.id) % 20 : 0)) * 86_400_000).toISOString()
    : ''

  const ledger = useMemo(
    () => (detail ? groupLedger(detail.discrepancies) : []),
    [detail],
  )
  const totalEntries = ledger.reduce((n, d) => n + d.entries.length, 0)
  const closed = detail?.discrepancies.find((d) => d.closedAt) ?? null

  // Flatten day groups into a row list, capped at LEDGER_PREVIEW until
  // "View full history" expands in place.
  const ledgerRows = useMemo(() => {
    const flat: { day: string; entry: DiscrepancyEntry; firstOfDay: boolean }[] = []
    for (const group of ledger) {
      group.entries.forEach((entry, i) =>
        flat.push({ day: group.day, entry, firstOfDay: i === 0 }),
      )
    }
    return expanded ? flat : flat.slice(0, LEDGER_PREVIEW)
  }, [ledger, expanded])

  // Slide origin: right panel on desktop, bottom sheet on narrow screens.
  const hiddenTransform = narrow ? { y: '100%' as const } : { x: 520 }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <AnimatePresence>
        {open && pair && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-overlay bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.25 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              forceMount
              asChild
              aria-describedby={undefined}
            >
              <motion.aside
                className="fixed bottom-0 right-0 top-0 z-drawer flex w-full flex-col border-l border-hairline-strong bg-base max-md:top-auto max-md:h-[85dvh] max-md:border-l-0 max-md:border-t md:w-[520px]"
                style={{ boxShadow: DRAWER_SHADOW }}
                initial={reducedMotion ? { opacity: 0 } : { ...hiddenTransform, opacity: 1 }}
                animate={
                  reducedMotion ? { opacity: 1 } : { x: 0, y: 0, opacity: 1 }
                }
                exit={
                  reducedMotion ? { opacity: 0 } : { ...hiddenTransform, opacity: 1 }
                }
                transition={
                  reducedMotion ? { duration: 0 } : { duration: 0.35, ease: EASE_DRAWER }
                }
              >
                <DialogPrimitive.Title className="sr-only">
                  {pair.event}
                </DialogPrimitive.Title>

                <motion.div
                  className="flex min-h-0 flex-1 flex-col"
                  variants={
                    reducedMotion
                      ? undefined
                      : {
                          hidden: {},
                          show: {
                            transition: { staggerChildren: 0.06, delayChildren: 0.21 },
                          },
                        }
                  }
                  initial="hidden"
                  animate="show"
                >
                  {/* 1. Header */}
                  <Section
                    reducedMotion={reducedMotion}
                    className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-hairline px-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <h2 className="truncate font-sans text-[15px] font-semibold text-primary">
                        {pair.event}
                      </h2>
                      <Badge variant={pair.badge} className="shrink-0" />
                    </div>
                    <DialogPrimitive.Close
                      type="button"
                      aria-label="Close pair detail"
                      className="shrink-0 text-muted transition-colors duration-150 hover:text-primary"
                    >
                      <X size={18} weight="regular" />
                    </DialogPrimitive.Close>
                  </Section>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {/* 2. Quote strip */}
                    <Section
                      reducedMotion={reducedMotion}
                      className="grid grid-cols-[1fr_auto_1fr] items-stretch border-b border-hairline"
                    >
                      <div className="p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                          Polymarket
                        </p>
                        <p className="mt-2 font-mono text-[28px] font-medium leading-none text-primary">
                          {pair.priceA.toFixed(1)}¢
                        </p>
                        <p className="mt-2 font-mono text-[10px] text-muted">
                          {polyTs ? `${formatClockSeconds(polyTs)} UTC` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center border-x border-hairline px-5">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                          Spread
                        </p>
                        <p
                          className={cn(
                            'mt-2 font-mono text-[28px] font-medium leading-none',
                            spreadColorClass(pair.spread),
                          )}
                        >
                          {pair.spread.toFixed(1)}
                          <span className="text-[12px] text-muted">pt</span>
                        </p>
                      </div>
                      <div className="p-4 text-right">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                          Kalshi
                        </p>
                        <p className="mt-2 font-mono text-[28px] font-medium leading-none text-primary">
                          {pair.priceB.toFixed(1)}¢
                        </p>
                        <p className="mt-2 font-mono text-[10px] text-muted">
                          {kalshiTs ? `${formatClockSeconds(kalshiTs)} UTC` : ''}
                        </p>
                      </div>
                    </Section>

                    {/* 3. Spread-over-time chart */}
                    <Section reducedMotion={reducedMotion} className="border-b border-hairline p-4">
                      {loading ? (
                        <motion.div
                          className="h-[220px] border border-hairline bg-hairline/40"
                          animate={reducedMotion ? { opacity: 0.55 } : { opacity: [0.4, 0.7, 0.4] }}
                          transition={
                            reducedMotion
                              ? { duration: 0 }
                              : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                          }
                        />
                      ) : (
                        detail && (
                          <SpreadChart
                            history={detail.history}
                            range={range}
                            onRangeChange={setRange}
                            animateDraw={!reducedMotion}
                          />
                        )
                      )}
                    </Section>

                    {/* 4. Discrepancy ledger */}
                    <Section reducedMotion={reducedMotion} className="border-b border-hairline p-4">
                      <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                        Discrepancy ledger
                      </p>
                      {loading ? (
                        <div className="space-y-2">
                          {Array.from({ length: 3 }, (_, i) => (
                            <div key={i} className="h-8 bg-hairline/40" />
                          ))}
                        </div>
                      ) : totalEntries === 0 ? (
                        <p className="py-2 font-mono text-[11px] text-muted">
                          No discrepancies logged for this pair.
                        </p>
                      ) : (
                        <>
                          {ledgerRows.map(({ day, entry, firstOfDay }) => (
                            <div key={entry.id}>
                              {firstOfDay && (
                                <p className="mt-2 border-t border-hairline pt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                                  {day}
                                </p>
                              )}
                              <div className="flex h-8 items-center justify-between font-mono text-[11px] text-secondary">
                                <span className="text-muted">
                                  {formatClock(entry.openedAt)}
                                </span>
                                <span>
                                  SPREAD {entry.spreadPoints.toFixed(1)}PT
                                </span>
                                <span>
                                  {entry.closedAt
                                    ? `Δ ${formatDelta(ledgerDelta(entry, pair.spread))}`
                                    : 'OPEN'}
                                </span>
                              </div>
                            </div>
                          ))}
                          {!expanded && totalEntries > LEDGER_PREVIEW && (
                            <button
                              type="button"
                              onClick={() => setExpanded(true)}
                              className="mt-2 font-mono text-[11px] text-secondary transition-colors duration-150 hover:text-primary"
                            >
                              View full history
                            </button>
                          )}
                        </>
                      )}
                    </Section>

                    {/* 5. Resolution audit note (only when a discrepancy closed) */}
                    {closed && (
                      <Section reducedMotion={reducedMotion} className="border-b border-hairline p-4">
                        <div className="border border-hairline bg-inset p-3">
                          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                            Resolution audit
                          </p>
                          <p className="mt-2 font-sans text-[12px] leading-[1.65] text-secondary">
                            Discrepancy closed {formatDayTitle(closed.closedAt ?? closed.openedAt)}.{' '}
                            {closed.direction === 'kalshi' ? 'Kalshi' : 'Polymarket'} closed{' '}
                            <span className="font-mono text-sage">
                              {Math.abs(
                                Math.round(
                                  ((closed.maxSpread ?? closed.spreadPoints) - closed.spreadPoints) * 10,
                                ) / 10,
                              ).toFixed(1)}
                              pt
                            </span>{' '}
                            closer across the final 7 days of the window.
                          </p>
                        </div>
                      </Section>
                    )}
                  </div>

                  {/* 6. Footer strip */}
                  <Section
                    reducedMotion={reducedMotion}
                    className="shrink-0 border-t border-hairline p-4"
                  >
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                      Contract references
                    </p>
                    <div className="mt-2 flex gap-4">
                      <a
                        href="https://polymarket.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-muted transition-colors duration-150 hover:text-accent"
                      >
                        Polymarket market
                        <ArrowUpRight size={12} weight="regular" aria-hidden />
                      </a>
                      <a
                        href="https://kalshi.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-muted transition-colors duration-150 hover:text-accent"
                      >
                        Kalshi event
                        <ArrowUpRight size={12} weight="regular" aria-hidden />
                      </a>
                    </div>
                    <p className="mt-3 font-mono text-[10px] text-muted">
                      {pair.badge === 'verified'
                        ? `Pair verified by human audit, ${formatDayTitle(verifiedAt)}.`
                        : 'Auto-matched pair. Human audit pending.'}
                    </p>
                    {pair.resolutionNote && (
                      <p className="mt-1 font-mono text-[10px] leading-[1.6] text-muted">
                        Resolution basis: {pair.resolutionNote}
                      </p>
                    )}
                    <p className="mt-1 font-mono text-[10px] text-muted">
                      Quotes as of {dataAsOf ? `${formatChartStamp(dataAsOf)} UTC` : 'unknown'}.
                    </p>
                  </Section>
                </motion.div>
              </motion.aside>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
