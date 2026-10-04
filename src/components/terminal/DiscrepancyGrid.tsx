import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Badge from '@/components/Badge'
import Sparkline from '@/components/Sparkline'
import { spreadColorClass } from '@/lib/format'
import { cn } from '@/lib/utils'
import StalenessPopover from './StalenessPopover'
import {
  CATEGORY_CHIPS,
  SORT_DIRECTION,
  SORT_LABEL,
  formatClock,
  formatDelta,
  type CategoryFilter,
  type Density,
  type GridPair,
  type SortKey,
} from './terminal-utils'

/**
 * MODULE 01: the cross-venue discrepancy grid (terminal.md §1). A real data
 * table at cockpit density: 40px rows, hairline dividers at 50%, no cards.
 * Rows FLIP-reorder on filter/sort change; stagger-in is capped to the first
 * 20 rows. All motion is transform/opacity only and disabled under reduced
 * motion.
 */

const EASE_OUT = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]

const CATEGORY_SHORT: Record<string, string> = {
  FED_RATES: 'FED/RATES',
  CPI: 'CPI/INFLATION',
  ELECTIONS: 'ELECTIONS',
  CRYPTO: 'CRYPTO',
}

const COLS = [
  { key: 'event', label: 'EVENT', width: undefined, align: 'left' },
  { key: 'a', label: 'VENUE A · POLY', width: 88, align: 'right' },
  { key: 'b', label: 'VENUE B · KALSHI', width: 88, align: 'right' },
  { key: 'spread', label: 'SPREAD', width: 80, align: 'right' },
  { key: 'delta', label: '24H Δ', width: 72, align: 'right' },
  { key: 'trend', label: 'TREND', width: 88, align: 'left' },
  { key: 'status', label: 'STATUS', width: 110, align: 'left' },
  { key: 'updated', label: 'UPDATED', width: 76, align: 'right' },
] as const

function SkeletonRows({ density, reducedMotion }: { density: Density; reducedMotion: boolean }) {
  const h = density === 'comfort' ? 'h-10' : 'h-8'
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => (
        <tr key={i} className={cn(h, 'border-b border-hairline/50')}>
          {COLS.map((c) => (
            <td key={c.key} className="px-3">
              <motion.div
                className="h-3 bg-hairline"
                style={{ width: c.key === 'event' ? '70%' : '60%', marginLeft: c.align === 'right' ? 'auto' : 0 }}
                animate={reducedMotion ? { opacity: 0.55 } : { opacity: [0.4, 0.7, 0.4] }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }
                }
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function DiscrepancyGrid({
  rows,
  counts,
  category,
  onCategoryChange,
  sortKey,
  onCycleSort,
  density,
  onDensityChange,
  filterInput,
  onFilterInputChange,
  onClearFilters,
  loading,
  degraded,
  dataAsOf,
  selectedId,
  onOpen,
  changedIds,
  reducedMotion,
}: {
  rows: GridPair[]
  counts: Record<CategoryFilter, number>
  category: CategoryFilter
  onCategoryChange: (c: CategoryFilter) => void
  sortKey: SortKey
  onCycleSort: () => void
  density: Density
  onDensityChange: (d: Density) => void
  filterInput: string
  onFilterInputChange: (v: string) => void
  onClearFilters: () => void
  loading: boolean
  degraded: boolean
  dataAsOf: string | null
  selectedId: string | null
  onOpen: (pair: GridPair) => void
  changedIds: ReadonlySet<string>
  reducedMotion: boolean
}) {
  const rowH = density === 'comfort' ? 'h-10' : 'h-8'
  const sortAnnouncement = useMemo(
    () =>
      `Sorted by ${SORT_LABEL[sortKey]}, ${
        SORT_DIRECTION[sortKey] === '↓' ? 'descending' : 'ascending'
      }.`,
    [sortKey],
  )

  return (
    <div id="discrepancy-grid" className="border border-hairline bg-raised">
      {/* Module header bar */}
      <div className="flex h-9 items-center justify-between border-b border-hairline px-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-muted">
            MODULE 01
          </span>
          <span aria-hidden className="h-3 w-px bg-hairline-strong" />
          <span className="truncate font-mono text-[10px] font-medium tracking-[0.14em] text-secondary">
            CROSS-VENUE DISCREPANCY GRID
          </span>
        </div>
        <div className="flex items-center gap-3">
          {dataAsOf && (
            <span className="hidden xl:block">
              <StalenessPopover dataAsOf={dataAsOf} degraded={degraded} />
            </span>
          )}
          <span className="font-mono text-[10px] text-muted">
            {rows.length} PAIRS
          </span>
          <div className="flex items-center gap-1" role="group" aria-label="Row density">
            {(['comfort', 'compact'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDensityChange(d)}
                aria-pressed={density === d}
                className={cn(
                  'h-5 px-1.5 font-mono text-[10px] uppercase transition-colors duration-150',
                  density === d ? 'text-accent' : 'text-muted hover:text-secondary',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex h-12 flex-wrap items-center gap-2 border-b border-hairline px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onCategoryChange(chip.key)}
              aria-pressed={category === chip.key}
              className={cn(
                'h-8 shrink-0 border px-3 font-mono text-[11px] uppercase transition-colors duration-150',
                category === chip.key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-hairline text-secondary hover:text-primary',
              )}
            >
              {chip.label}{' '}
              <span className="text-muted">{counts[chip.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCycleSort}
            className="h-8 font-mono text-[10px] uppercase tracking-[0.1em] text-secondary transition-colors duration-150 hover:text-primary"
          >
            SORT: <span className="text-primary">{SORT_LABEL[sortKey]}</span>{' '}
            {SORT_DIRECTION[sortKey]}
          </button>
          <label htmlFor="grid-filter" className="sr-only">
            Filter events
          </label>
          <input
            id="grid-filter"
            type="text"
            value={filterInput}
            onChange={(e) => onFilterInputChange(e.target.value)}
            placeholder="FILTER EVENTS"
            className="h-8 w-44 border border-hairline bg-transparent px-2 font-mono text-[11px] uppercase tracking-[0.08em] text-primary placeholder:text-muted"
          />
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {sortAnnouncement}
      </p>

      {/* Degraded-feed banner: calm, no red, rows still render from cache */}
      {degraded && dataAsOf && (
        <div className="flex h-8 items-center border-b border-hairline px-3">
          <span className="font-mono text-[11px] text-secondary">
            Venue feed interrupted. Showing last confirmed quotes from{' '}
            {formatClock(dataAsOf)} UTC.
          </span>
        </div>
      )}

      {/* The grid: horizontally scrollable below 768px, min width keeps columns honest */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] table-fixed">
          <colgroup>
            {COLS.map((c) => (
              <col key={c.key} style={c.width ? { width: c.width } : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr className="h-8 border-b border-hairline">
              {COLS.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    'px-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted',
                    c.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows density={density} reducedMotion={reducedMotion} />
            ) : rows.length === 0 ? (
              <tr className="h-24">
                <td colSpan={COLS.length} className="px-3 text-center">
                  <span className="font-mono text-[12px] text-muted">
                    No pairs match this filter.
                  </span>{' '}
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="font-mono text-[12px] text-secondary underline-offset-2 transition-colors duration-150 hover:text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {rows.map((pair, i) => {
                  const selected = pair.id === selectedId
                  const changed = changedIds.has(pair.id)
                  return (
                    <motion.tr
                      key={pair.id}
                      layout={reducedMotion ? undefined : 'position'}
                      initial={
                        reducedMotion || i >= 20 ? false : { opacity: 0, y: 8 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : {
                              duration: 0.25,
                              delay: i < 20 ? i * 0.018 : 0,
                              ease: EASE_OUT,
                              layout: { type: 'spring', stiffness: 170, damping: 26 },
                            }
                      }
                      tabIndex={0}
                      aria-selected={selected}
                      onClick={() => onOpen(pair)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onOpen(pair)
                        }
                      }}
                      className={cn(
                        'group cursor-pointer border-b border-hairline/50 transition-[background-color] duration-150',
                        rowH,
                        selected ? 'bg-inset' : 'hover:bg-inset',
                      )}
                    >
                      {/* EVENT */}
                      <td className="relative px-3">
                        <span
                          aria-hidden
                          className={cn(
                            'absolute left-0 top-0 h-full w-[2px] origin-left transition-transform duration-150',
                            selected
                              ? 'scale-x-100 bg-accent'
                              : 'scale-x-0 bg-accent-dim group-hover:scale-x-100',
                          )}
                        />
                        <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-muted xl:hidden">
                          {CATEGORY_SHORT[pair.category]}
                        </span>
                        <span className="block truncate font-sans text-[13px] font-medium text-primary">
                          {pair.event}
                        </span>
                      </td>
                      {/* VENUE A */}
                      <td
                        className={cn(
                          'px-3 text-right font-mono text-[13px] transition-colors duration-150',
                          changed ? 'text-accent' : 'text-primary',
                        )}
                      >
                        {pair.priceA.toFixed(1)}¢
                      </td>
                      {/* VENUE B */}
                      <td
                        className={cn(
                          'px-3 text-right font-mono text-[13px] transition-colors duration-150',
                          changed ? 'text-accent' : 'text-primary',
                        )}
                      >
                        {pair.priceB.toFixed(1)}¢
                      </td>
                      {/* SPREAD */}
                      <td className="px-3 text-right font-mono text-[13px] font-semibold">
                        <span
                          className={cn(
                            'transition-colors duration-150',
                            changed ? 'text-accent' : spreadColorClass(pair.spread),
                          )}
                        >
                          {pair.spread.toFixed(1)}
                        </span>
                        <span className="text-[10px] font-normal text-muted">pt</span>
                      </td>
                      {/* 24H Δ */}
                      <td className="px-3 text-right font-mono text-[12px] text-secondary">
                        {formatDelta(pair.delta24h)}
                      </td>
                      {/* TREND */}
                      <td className="px-3">
                        <span className="group/spark relative inline-flex">
                          <Sparkline samples={pair.spark} spread={pair.spread} />
                          <span className="pointer-events-none absolute -top-8 right-0 flex gap-2 border border-hairline-strong bg-raised px-2 py-1 font-mono text-[10px] opacity-0 transition-opacity duration-150 group-hover/spark:opacity-100">
                            {pair.spark.slice(-3).map((v, j, arr) => (
                              <span
                                key={j}
                                className={j === arr.length - 1 ? 'text-primary' : 'text-muted'}
                              >
                                {v.toFixed(1)}
                              </span>
                            ))}
                          </span>
                        </span>
                      </td>
                      {/* STATUS */}
                      <td className="px-3">
                        <Badge variant={pair.badge} />
                      </td>
                      {/* UPDATED */}
                      <td className="px-3 text-right font-mono text-[11px] text-muted">
                        {formatClock(pair.updatedAt)}
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
