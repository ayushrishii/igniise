import { motion } from 'motion/react'
import { spreadColorClass } from '@/lib/format'
import { cn } from '@/lib/utils'
import { formatDelta, type GridPair } from './terminal-utils'

/**
 * Right-rail summary stack (terminal.md §3): SESSION counters, WATCH movers,
 * and the deliberately inert dashed MODULE 02 - RESERVED growth slot.
 * Modules stagger in after the grid rows; no motion under reduced motion.
 */

const EASE_MICRO = [0.16, 1, 0.3, 1] as [number, number, number, number]

function RailModule({
  index,
  reducedMotion,
  className,
  children,
}: {
  index: number
  reducedMotion: boolean
  className?: string
  children: React.ReactNode
}) {
  if (reducedMotion) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.45 + index * 0.09, ease: EASE_MICRO }}
    >
      {children}
    </motion.div>
  )
}

function StatRow({
  label,
  value,
  suffix,
  loading,
}: {
  label: string
  value: string
  suffix?: string
  loading?: boolean
}) {
  return (
    <div className="border-b border-hairline py-3 last:border-b-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      {loading ? (
        <div className="mt-1 h-5 w-16 animate-pulse bg-hairline" />
      ) : (
        <p className="mt-1 font-mono text-[20px] leading-none text-primary">
          {value}
          {suffix && <span className="text-[11px] text-muted">{suffix}</span>}
        </p>
      )}
    </div>
  )
}

export default function SummaryRail({
  pairsTracked,
  meanSpread,
  largestSpread,
  wideCount,
  sessionStart,
  sessionEnd,
  movers,
  onOpenPair,
  onAllMovements,
  changedIds,
  loading,
  reducedMotion,
}: {
  pairsTracked: number
  meanSpread: number
  largestSpread: number
  wideCount: number
  sessionStart: string
  sessionEnd: string
  movers: GridPair[]
  onOpenPair: (pair: GridPair) => void
  onAllMovements: () => void
  changedIds: ReadonlySet<string>
  loading: boolean
  reducedMotion: boolean
}) {
  return (
    <div className="space-y-4">
      {/* MODULE: SESSION */}
      <RailModule
        index={0}
        reducedMotion={reducedMotion}
        className="border border-hairline bg-raised p-4"
      >
        <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          Session
        </p>
        <StatRow
          label="Pairs tracked"
          value={String(pairsTracked)}
          loading={loading}
        />
        <StatRow
          label="Mean spread"
          value={meanSpread.toFixed(1)}
          suffix="PT"
          loading={loading}
        />
        <StatRow
          label="Largest current spread"
          value={largestSpread.toFixed(1)}
          suffix="PT"
          loading={loading}
        />
        <StatRow label="Spreads ≥ 7.0pt" value={String(wideCount)} loading={loading} />
        <p className="pt-3 font-mono text-[10px] text-muted">
          Session window: {sessionStart} - {sessionEnd}
        </p>
      </RailModule>

      {/* MODULE: WATCH */}
      <RailModule
        index={1}
        reducedMotion={reducedMotion}
        className="border border-hairline bg-raised p-4"
      >
        <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          Watch
        </p>
        {loading ? (
          <div className="space-y-2 pt-1">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-8 animate-pulse bg-hairline/40" />
            ))}
          </div>
        ) : movers.length === 0 ? (
          <p className="py-2 font-mono text-[11px] text-muted">
            No movements in the current window.
          </p>
        ) : (
          <ul>
            {movers.map((mover) => (
              <li key={mover.id}>
                <button
                  type="button"
                  onClick={() => onOpenPair(mover)}
                  className="flex h-8 w-full items-center justify-between gap-3 text-left transition-colors duration-150 hover:bg-inset"
                >
                  <span className="truncate font-sans text-[12px] text-secondary">
                    {mover.event}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 font-mono text-[12px] transition-colors duration-150',
                      changedIds.has(mover.id)
                        ? 'text-accent'
                        : spreadColorClass(mover.spread),
                    )}
                  >
                    {formatDelta(mover.delta24h)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={onAllMovements}
          className="mt-2 font-mono text-[11px] text-secondary transition-colors duration-150 hover:text-primary"
        >
          All movements →
        </button>
      </RailModule>

      {/* MODULE 02 - RESERVED: the designed growth affordance. Inert by spec. */}
      <RailModule
        index={2}
        reducedMotion={reducedMotion}
        className="flex h-40 flex-col items-center justify-center border border-dashed border-hairline-strong bg-base"
      >
        <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted">
          MODULE 02 - RESERVED
        </p>
        <p className="mt-2 font-mono text-[10px] text-muted/70">
          This shell is built to grow.
        </p>
      </RailModule>
    </div>
  )
}
