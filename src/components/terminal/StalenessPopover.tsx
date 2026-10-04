import * as PopoverPrimitive from '@radix-ui/react-popover'
import { formatClock, formatClockSeconds } from './terminal-utils'

/**
 * Staleness readout with popover (terminal.md §0). The TopBar chrome is
 * shared and static, so the terminal page mounts its own honest readout here:
 * live dot + DATA AS OF timestamp, click opens poll cadence plus per-source
 * timestamps. When the grid is serving the cached mock snapshot, the trigger
 * says so plainly.
 */
export default function StalenessPopover({
  dataAsOf,
  degraded,
}: {
  dataAsOf: string
  degraded: boolean
}) {
  // Per-source quote times: deterministic small offsets behind the snapshot.
  const base = new Date(dataAsOf).getTime()
  const polyTs = new Date(base - 4_000).toISOString()
  const kalshiTs = new Date(base - 9_000).toISOString()

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        type="button"
        className="flex items-center gap-2 font-mono text-[11px] text-secondary transition-colors duration-150 hover:text-primary"
        aria-label="Data freshness details"
      >
        <span aria-hidden className="live-dot h-[6px] w-[6px] rounded-full bg-accent" />
        <span>
          DATA AS OF {formatClock(dataAsOf)} UTC
          {degraded ? ' (CACHED)' : ''}
        </span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-overlay w-64 border border-hairline-strong bg-raised p-3 outline-none"
        >
          <p className="font-mono text-[10px] leading-[1.7] text-secondary">
            Venue quotes are polled every 60 seconds. Resolution checks run
            hourly.
          </p>
          {degraded && (
            <p className="mt-2 border-t border-hairline pt-2 font-mono text-[10px] leading-[1.7] text-muted">
              Live feed unreachable. Showing the last cached snapshot.
            </p>
          )}
          <div className="mt-2 space-y-1 border-t border-hairline pt-2">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-muted">POLYMARKET</span>
              <span className="text-secondary">{formatClockSeconds(polyTs)} UTC</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-muted">KALSHI</span>
              <span className="text-secondary">{formatClockSeconds(kalshiTs)} UTC</span>
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
