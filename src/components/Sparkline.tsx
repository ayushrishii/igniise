import { memo } from 'react'

/**
 * Sparkline (design.md §5.5). 72x20 SVG, 1.25px stroke, round caps,
 * 2px endpoint marker on the latest value. Stroke: text-secondary at rest,
 * accent when the current spread >= 7.0pt. Renders the last 24 hourly samples.
 */
function SparklineInner({
  samples,
  spread,
  className,
}: {
  samples: number[]
  spread: number
  className?: string
}) {
  const data = samples.slice(-24)
  const W = 72
  const H = 20
  const PAD = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = (W - PAD * 2) / (data.length - 1)
  const pts = data.map((v, i) => ({
    x: PAD + i * stepX,
    y: H - PAD - ((v - min) / range) * (H - PAD * 2),
  }))
  const d = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ')
  const last = pts[pts.length - 1]
  const stroke = spread >= 7.0 ? '#C9963F' : '#A39C8E'

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={1.4} fill={stroke} />
    </svg>
  )
}

const Sparkline = memo(SparklineInner)
export default Sparkline
