import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { TERMINAL_STATS } from '@/lib/data'
import DiscrepancyGrid from '@/components/terminal/DiscrepancyGrid'
import PairDrawer from '@/components/terminal/PairDrawer'
import SummaryRail from '@/components/terminal/SummaryRail'
import { useTerminalFeed, useTerminalStats } from '@/components/terminal/use-terminal-data'
import {
  CATEGORY_CHIPS,
  SORT_CYCLE,
  formatDayTitle,
  sortPairs,
  type CategoryFilter,
  type Density,
  type GridPair,
  type SortKey,
} from '@/components/terminal/terminal-utils'

/**
 * Terminal (`/terminal`). The instrument: 8-col discrepancy grid + 4-col
 * summary stack on a 12-col frame, collapsing to a single column below
 * 1024px. Native scroll, no Lenis. Category and pair selection persist in
 * URL params (`?cat=`, `?pair=` deep links from the manifesto ticker).
 */

const VALID_CATS = new Set(CATEGORY_CHIPS.map((c) => c.key))

export default function Terminal() {
  const reducedMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()

  const catParam = searchParams.get('cat')
  const category: CategoryFilter = VALID_CATS.has(catParam as CategoryFilter)
    ? (catParam as CategoryFilter)
    : 'ALL'

  const [sortKey, setSortKey] = useState<SortKey>('SPREAD')
  const [density, setDensity] = useState<Density>('comfort')
  const [filterInput, setFilterInput] = useState('')
  const [filter, setFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(
    () => searchParams.get('pair'),
  )
  const [changedIds, setChangedIds] = useState<ReadonlySet<string>>(new Set())

  // Debounced text filter (150ms, terminal.md interactions summary).
  useEffect(() => {
    const t = setTimeout(() => setFilter(filterInput.trim().toLowerCase()), 150)
    return () => clearTimeout(t)
  }, [filterInput])

  // Active feed (server-side category filter) + unfiltered feed for counts,
  // session stats, and the watch list. Both degrade to the mock layer.
  const activeFeed = useTerminalFeed(category)
  const allFeed = useTerminalFeed('ALL')
  const stats = useTerminalStats()

  const counts = useMemo(() => {
    const out: Record<CategoryFilter, number> = {
      ALL: allFeed.pairs.length,
      FED_RATES: 0,
      CPI: 0,
      ELECTIONS: 0,
      CRYPTO: 0,
    }
    for (const p of allFeed.pairs) out[p.category] += 1
    return out
  }, [allFeed.pairs])

  const rows = useMemo(() => {
    const filtered = filter
      ? activeFeed.pairs.filter((p) => p.event.toLowerCase().includes(filter))
      : activeFeed.pairs
    return sortPairs(filtered, sortKey)
  }, [activeFeed.pairs, filter, sortKey])

  // Live update tick: on each 60s poll, cells whose quotes moved flash accent
  // for 600ms, then settle to the rule color. Tracked over the full feed so
  // grid rows and watch movers flash together. Disabled under reduced motion.
  const signature = allFeed.pairs
    .map((p) => `${p.id}:${p.priceA}:${p.priceB}:${p.spread}`)
    .join('|')
  const prevSignature = useRef<Map<string, string> | null>(null)
  useEffect(() => {
    const next = new Map(allFeed.pairs.map((p) => [p.id, `${p.priceA}:${p.priceB}:${p.spread}`]))
    const prev = prevSignature.current
    prevSignature.current = next
    if (reducedMotion || !prev) return
    const changed = allFeed.pairs
      .filter((p) => prev.has(p.id) && prev.get(p.id) !== next.get(p.id))
      .map((p) => p.id)
    if (changed.length === 0) return
    setChangedIds(new Set(changed))
    const t = setTimeout(() => setChangedIds(new Set()), 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, reducedMotion])

  const setCategory = useCallback(
    (c: CategoryFilter) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (c === 'ALL') next.delete('cat')
          else next.set('cat', c)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const openPair = useCallback(
    (pair: GridPair) => {
      setSelectedId(pair.id)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('pair', pair.id)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const closeDrawer = useCallback(() => {
    setSelectedId(null)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('pair')
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  const onCycleSort = useCallback(() => {
    setSortKey((current) => {
      if (current === 'DELTA') return 'SPREAD'
      const idx = SORT_CYCLE.indexOf(current)
      return SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]
    })
  }, [])

  const onAllMovements = useCallback(() => {
    setCategory('ALL')
    setFilterInput('')
    setFilter('')
    setSortKey('DELTA')
    const el = document.getElementById('discrepancy-grid')
    el?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
  }, [setCategory, reducedMotion])

  const onClearFilters = useCallback(() => {
    setCategory('ALL')
    setFilterInput('')
    setFilter('')
  }, [setCategory])

  // Selected pair: prefer the live rows, then the full feed, then the mock
  // layer (so a stale ?pair= deep link still opens a coherent drawer).
  const selectedPair = useMemo<GridPair | null>(() => {
    if (!selectedId) return null
    const found =
      activeFeed.pairs.find((p) => p.id === selectedId) ??
      allFeed.pairs.find((p) => p.id === selectedId)
    return found ?? null
  }, [selectedId, activeFeed.pairs, allFeed.pairs])

  // Session stats derive from the full feed (same numbers the manifesto cites).
  const session = useMemo(() => {
    const pairs = allFeed.pairs
    const mean =
      pairs.length > 0
        ? pairs.reduce((n, p) => n + p.spread, 0) / pairs.length
        : 0
    const largest = pairs.length > 0 ? Math.max(...pairs.map((p) => p.spread)) : 0
    const wide = pairs.filter((p) => p.spread >= 7.0).length
    const endIso = allFeed.dataAsOf ?? TERMINAL_STATS.dataAsOf
    const startIso = new Date(
      new Date(endIso).getTime() - 7 * 86_400_000,
    ).toISOString()
    return {
      mean,
      largest,
      wide,
      start: formatDayTitle(startIso),
      end: formatDayTitle(endIso),
    }
  }, [allFeed.pairs, allFeed.dataAsOf])

  const movers = useMemo(
    () =>
      [...allFeed.pairs]
        .sort((a, b) => Math.abs(b.delta24h) - Math.abs(a.delta24h))
        .slice(0, 3),
    [allFeed.pairs],
  )

  return (
    <div className="mx-auto max-w-[1440px] px-5 md:px-8">
      <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-12">
        <section className="min-w-0 lg:col-span-8" aria-label="Discrepancy grid">
          <DiscrepancyGrid
            rows={rows}
            counts={counts}
            category={category}
            onCategoryChange={setCategory}
            sortKey={sortKey}
            onCycleSort={onCycleSort}
            density={density}
            onDensityChange={setDensity}
            filterInput={filterInput}
            onFilterInputChange={setFilterInput}
            onClearFilters={onClearFilters}
            loading={activeFeed.loading}
            degraded={activeFeed.degraded}
            dataAsOf={activeFeed.dataAsOf}
            selectedId={selectedId}
            onOpen={openPair}
            changedIds={changedIds}
            reducedMotion={reducedMotion}
          />
        </section>
        <aside className="min-w-0 lg:col-span-4" aria-label="Session summary">
          <SummaryRail
            pairsTracked={stats.pairsTracked}
            meanSpread={session.mean}
            largestSpread={session.largest}
            wideCount={session.wide}
            sessionStart={session.start}
            sessionEnd={session.end}
            movers={movers}
            onOpenPair={openPair}
            onAllMovements={onAllMovements}
            changedIds={changedIds}
            loading={allFeed.loading}
            reducedMotion={reducedMotion}
          />
        </aside>
      </div>

      {/* Compliance strip mirrored under the page grid (terminal.md §4) */}
      <div className="border-t border-hairline py-4">
        <p className="font-mono text-[10px] text-muted">
          Implied probabilities are venue quotes, not forecasts. Igniise does
          not transact in event contracts.
        </p>
      </div>

      <PairDrawer
        pair={selectedPair}
        open={selectedPair !== null}
        onClose={closeDrawer}
        feedDataAsOf={activeFeed.dataAsOf ?? allFeed.dataAsOf}
        reducedMotion={reducedMotion}
      />
    </div>
  )
}
