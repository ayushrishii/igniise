import { CheckCircle, Robot } from '@phosphor-icons/react'
import type { VerificationBadge } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Verification badge (design.md §5.4). Sharp corners, h-5 px-2, 1px border.
 * Verified: accent-dim hairline + accent check. Auto-matched: hairline + secondary glyph.
 */
export default function Badge({
  variant,
  className,
}: {
  variant: VerificationBadge
  className?: string
}) {
  const verified = variant === 'verified'
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 border px-2 font-mono text-[9.5px] uppercase tracking-[0.1em]',
        verified
          ? 'border-accent-dim text-accent'
          : 'border-hairline text-secondary',
        className,
      )}
    >
      {verified ? (
        <CheckCircle size={12} weight="regular" aria-hidden />
      ) : (
        <Robot size={12} weight="regular" aria-hidden />
      )}
      {verified ? 'Verified' : 'Auto-matched'}
    </span>
  )
}
