import { useMemo, useRef, useState, useEffect } from 'react'
import { motion } from 'motion/react'
import type { SpreadPoint, SpreadRange } from '@contracts/terminal'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { spreadColorClass } from '@/lib/format'
import { cn } from '@/lib/utils'
import { formatChartStamp, formatDayUpper } from './terminal-utils'

/**
 * Spread-over-time chart (design.md §5.6, terminal.md §2.3). Hand-built SVG:
 * venue A solid bone line, venue B dashed muted line, accent spread band at
 * 8% fading to 0%, crosshair tooltip with stacked mono rows. Y axis is fixed
 * 0-100 (implied probability in cents).
 */

const RANGES: SpreadRange[] = ['7d', '30d', '90d']
const H = 220
const PAD_L = 34
const PAD_R = 10
const PAD_T = 10
const PAD_B = 22

const COL_A = '#EDEAE3'
const COL_B = '#615C52'
const COL_GRID = '#26231E'
const COL_TICK = '#615C52'

function usePlotWidth(ref: React.RefObject<HTMLDivElement | null>): number {
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setW(entry.contentRect.width)
    })
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [ref])
  return w
}

export default function SpreadChart({
  history,
  range,
  onRangeChange,
  animateDraw,
}: {
  history: SpreadPoint[]
  range: SpreadRange
  onRangeChange: (range: SpreadRange) => void
  animateDraw: boolean
}) {
  const reducedMotion = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const width = usePlotWidth(wrapRef)
  const [hover, setHover] = useState<number | null>(null)

  const geom = useMemo(() => {
    if (history.length < 2 || width <= 0) return null
    const plotW = width - PAD_L - PAD_R
    const plotH = H - PAD_T - PAD_B
    const t0 = new Date(history[0].ts).getTime()
    const t1 = new Date(history[history.length - 1].ts).getTime()
    const span = Math.max(1, t1 - t0)
    const x = (ts: string) =>
      PAD_L + ((new Date(ts).getTime() - t0) / span) * plotW
    const y = (v: number) => PAD_T + (1 - v / 100) * plotH

    const pts = history.map((p) => ({
      p,
      x: x(p.ts),
      ya: y(p.priceA),
      yb: y(p.priceB),
    }))
    const line = (key: 'ya' | 'yb') =>
      pts
        .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(2)},${pt[key].toFixed(2)}`)
        .join(' ')
    const band =
      pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(2)},${pt.ya.toFixed(2)}`).join(' ') +
      ' ' +
      [...pts]
        .reverse()
        .map((pt) => `L${pt.x.toFixed(2)},${pt.yb.toFixed(2)}`)
        .join(' ') +
      ' Z'

    const yTicks = [0, 25, 50, 75, 100].map((v) => ({ v, y: y(v) }))
    const xTicks = [0, 0.33, 0.66, 1].map((f) => {
      const idx = Math.min(history.length - 1, Math.round(f * (history.length - 1)))
      return { x: x(history[idx].ts), label: formatDayUpper(history[idx].ts) }
    })
    return { pts, lineA: line('ya'), lineB: line('yb'), band, yTicks, xTicks, plotW, plotH }
  }, [history, width])

  const draw = animateDraw && !reducedMotion

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    if (!geom) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    let best = 0
    let bestDist = Infinity
    geom.pts.forEach((pt, i) => {
      const d = Math.abs(pt.x - mx)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    setHover(best)
  }

  const hoverPt = hover !== null && geom ? geom.pts[hover] : null
  const hoverSpread = hoverPt ? Math.abs(hoverPt.p.priceA - hoverPt.p.priceB) : 0
  // Clamp the tooltip inside the plot horizontally.
  const tooltipLeft = hoverPt
    ? Math.min(Math.max(hoverPt.x + 12, PAD_L), Math.max(PAD_L, width - PAD_R - 148))
    : 0

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          Spread over time
        </span>
        <div className="flex gap-1" role="group" aria-label="Chart range">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              aria-pressed={range === r}
              className={cn(
                'h-6 border px-2 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors duration-150',
                range === r
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-hairline text-secondary hover:text-primary',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative h-[220px] border border-hairline bg-inset"
      >
        {!geom ? (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[11px] text-muted">
              No spread history for this range.
            </span>
          </div>
        ) : (
          <>
            <svg
              width={width}
              height={H}
              viewBox={`0 0 ${width} ${H}`}
              className="block"
              role="img"
              aria-label="Dual-venue implied probability over time"
            >
              <defs>
                <linearGradient id="spreadBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9963F" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#C9963F" stopOpacity="0" />
                </linearGradient>
              </defs>

              {geom.yTicks.map((t) => (
                <g key={t.v}>
                  <line
                    x1={PAD_L}
                    x2={width - PAD_R}
                    y1={t.y}
                    y2={t.y}
                    stroke={COL_GRID}
                    strokeWidth={1}
                    opacity={t.v === 0 ? 1 : 0.5}
                  />
                  <text
                    x={PAD_L - 6}
                    y={t.y + 3}
                    textAnchor="end"
                    fontSize={9.5}
                    fill={COL_TICK}
                    className="font-mono"
                  >
                    {t.v}
                  </text>
                </g>
              ))}
              {geom.xTicks.map((t, i) => (
                <text
                  key={i}
                  x={t.x}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize={9.5}
                  fill={COL_TICK}
                  className="font-mono"
                >
                  {t.label}
                </text>
              ))}

              <path d={geom.band} fill="url(#spreadBand)" />

              {draw ? (
                <>
                  <motion.path
                    key={`a-${range}`}
                    d={geom.lineA}
                    fill="none"
                    stroke={COL_A}
                    strokeWidth={1.5}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                  <motion.path
                    key={`b-${range}`}
                    d={geom.lineB}
                    fill="none"
                    stroke={COL_B}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </>
              ) : (
                <>
                  <path d={geom.lineA} fill="none" stroke={COL_A} strokeWidth={1.5} />
                  <path
                    d={geom.lineB}
                    fill="none"
                    stroke={COL_B}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                </>
              )}

              {hoverPt && (
                <g>
                  <line
                    x1={hoverPt.x}
                    x2={hoverPt.x}
                    y1={PAD_T}
                    y2={H - PAD_B}
                    stroke="#3A352D"
                    strokeWidth={1}
                  />
                  <circle cx={hoverPt.x} cy={hoverPt.ya} r={2.5} fill={COL_A} />
                  <circle cx={hoverPt.x} cy={hoverPt.yb} r={2.5} fill={COL_B} />
                </g>
              )}

              <rect
                x={PAD_L}
                y={PAD_T}
                width={geom.plotW}
                height={geom.plotH}
                fill="transparent"
                onMouseMove={onMove}
                onMouseLeave={() => setHover(null)}
              />
            </svg>

            {hoverPt && (
              <div
                className="pointer-events-none absolute top-3 border border-hairline-strong bg-raised font-mono text-[10px]"
                style={{ left: tooltipLeft }}
              >
                <div className="border-b border-hairline px-2 py-1 text-muted">
                  {formatChartStamp(hoverPt.p.ts)}
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-hairline px-2 py-1">
                  <span className="text-muted">POLY</span>
                  <span className="text-primary">{hoverPt.p.priceA.toFixed(1)}¢</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-hairline px-2 py-1">
                  <span className="text-muted">KALSHI</span>
                  <span className="text-secondary">{hoverPt.p.priceB.toFixed(1)}¢</span>
                </div>
                <div className="flex items-center justify-between gap-4 px-2 py-1">
                  <span className="text-muted">SPREAD</span>
                  <span className={spreadColorClass(hoverSpread)}>
                    {hoverSpread.toFixed(1)}PT
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-2 flex items-center gap-4 font-mono text-[9.5px] text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-px w-4 bg-primary" />
          POLYMARKET
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-px w-4 border-t border-dashed border-muted"
          />
          KALSHI
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2 w-4 bg-accent/10" />
          SPREAD BAND
        </span>
      </div>
    </div>
  )
}
