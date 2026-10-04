import { useEffect, useMemo, useState } from 'react'
import { trpc } from '@/providers/trpc'
import { PAIRS, TERMINAL_STATS } from '@/lib/data'
import type { Pair } from '@/lib/types'
import type { SpreadRange } from '@contracts/terminal'
import {
  buildFallbackDetail,
  enrichPair,
  type CategoryFilter,
  type GridPair,
} from './terminal-utils'

/**
 * Terminal data hooks. Live tRPC first, deterministic mock fallback on any
 * failure (offline API, DB outage served as an empty feed, unknown pair id).
 * The `degraded` flag drives the honest staleness readout: the UI never
 * renders a crashed page, and cached data is always labeled as cached.
 */

export interface FeedResult {
  pairs: GridPair[]
  dataAsOf: string | null
  degraded: boolean
  loading: boolean
}

export function useTerminalFeed(category: CategoryFilter): FeedResult {
  const apiCategory = category === 'ALL' ? undefined : category
  const query = trpc.terminal.feed.useQuery(
    { category: apiCategory },
    { refetchInterval: 60_000, retry: 1, staleTime: 30_000 },
  )

  const degraded =
    query.isError || (query.isSuccess && query.data.pairs.length === 0)

  return useMemo(() => {
    if (degraded) {
      const mock = PAIRS.filter((p) => !apiCategory || p.category === apiCategory)
      return {
        pairs: mock.map((p) => enrichPair(p, TERMINAL_STATS.dataAsOf)),
        dataAsOf: TERMINAL_STATS.dataAsOf,
        degraded: true,
        loading: false,
      }
    }
    if (!query.isSuccess) {
      return { pairs: [], dataAsOf: null, degraded: false, loading: true }
    }
    const dataAsOf = query.data.dataAsOf
    return {
      pairs: query.data.pairs.map((p) => enrichPair(p as Pair, dataAsOf)),
      dataAsOf,
      degraded: false,
      loading: false,
    }
  }, [degraded, query.isSuccess, query.data, apiCategory])
}

export interface StatsResult {
  pairsTracked: number
  degraded: boolean
  loading: boolean
}

export function useTerminalStats(): StatsResult {
  const query = trpc.terminal.stats.useQuery(undefined, {
    refetchInterval: 60_000,
    retry: 1,
    staleTime: 30_000,
  })
  if (query.isError) {
    return {
      pairsTracked: TERMINAL_STATS.pairsTracked,
      degraded: true,
      loading: false,
    }
  }
  if (!query.isSuccess) {
    return { pairsTracked: 0, degraded: false, loading: true }
  }
  return {
    pairsTracked: query.data.pairsTracked,
    degraded: false,
    loading: false,
  }
}

export interface PairDetailResult {
  detail: ReturnType<typeof buildFallbackDetail> | null
  loading: boolean
  degraded: boolean
}

export function usePairDetail(
  pair: GridPair | null,
  range: SpreadRange,
  open: boolean,
  feedDataAsOf: string | null,
): PairDetailResult {
  const numericId = pair ? Number(pair.id) : NaN
  const validId = Number.isInteger(numericId) && numericId > 0
  const query = trpc.terminal.pairDetail.useQuery(
    { id: validId ? numericId : 1, range },
    { enabled: open && validId && pair !== null, retry: 1 },
  )

  return useMemo(() => {
    if (!pair) return { detail: null, loading: false, degraded: false }
    if (validId && query.isPending) {
      return { detail: null, loading: true, degraded: false }
    }
    if (validId && query.isSuccess && query.data) {
      return { detail: query.data, loading: false, degraded: false }
    }
    // Mock ids (slugs), query errors, and null payloads all land here:
    // synthesize a deterministic detail from the row the user clicked.
    const dataAsOf = feedDataAsOf ?? TERMINAL_STATS.dataAsOf
    return {
      detail: buildFallbackDetail(pair, range, dataAsOf),
      loading: false,
      degraded: true,
    }
  }, [pair, validId, query.isPending, query.isSuccess, query.data, range, feedDataAsOf])
}

/** Reactive media query flag (used for the drawer bottom-sheet breakpoint). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}
