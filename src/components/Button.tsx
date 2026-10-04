import { Link } from 'react-router'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Buttons (design.md §5.3). Sharp corners, Geist Mono 600, 12px uppercase.
 * Primary: bronze fill, hover shifts to #D6A54E with a 2px label nudge.
 * Ghost: 1px hairline-strong border, transparent fill.
 * One CTA intent per page, one label: "Enter the Terminal".
 */

const base =
  'group inline-flex h-11 items-center px-7 font-mono text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors duration-150 active:translate-y-[1px]'

export function PrimaryButton({
  to,
  children,
  className,
}: {
  to: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        base,
        'bg-accent text-accent-ink hover:bg-[#D6A54E]',
        className,
      )}
    >
      <span className="transition-transform duration-150 group-hover:translate-x-[2px]">
        {children}
      </span>
      <span
        aria-hidden
        className="ml-2 transition-transform duration-150 group-hover:translate-x-[2px]"
      >
        &rarr;
      </span>
    </Link>
  )
}

export function GhostButton({
  to,
  children,
  className,
}: {
  to: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        base,
        'border border-hairline-strong bg-transparent text-secondary hover:border-accent-dim hover:text-primary',
        className,
      )}
    >
      <span className="transition-transform duration-150 group-hover:translate-x-[2px]">
        {children}
      </span>
    </Link>
  )
}
