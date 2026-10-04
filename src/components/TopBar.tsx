import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { List, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { TERMINAL_STATS } from '@/lib/data'
import { formatTimestamp } from '@/lib/format'

const NAV = [
  { label: 'MANIFESTO', to: '/' },
  { label: 'TERMINAL', to: '/terminal' },
  { label: 'METHODOLOGY', to: '/methodology' },
]

/**
 * TopBar (design.md §5.1). 64px, bg-base, bottom hairline, sticky in normal
 * flow. Gains bg-base/92 + backdrop-blur-sm after 24px of scroll, 200ms
 * transition, never hides. Staleness readout appears on the terminal only.
 */
export default function TopBar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const onTerminal = pathname.startsWith('/terminal')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-nav h-16 border-b border-hairline transition-[background-color] duration-200',
        scrolled ? 'bg-base/92 backdrop-blur-sm' : 'bg-base',
      )}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-sans text-[15px] font-semibold tracking-[-0.01em] text-primary">
            igniise
          </span>
          <span aria-hidden className="h-4 w-px bg-hairline-strong" />
          <span className="font-mono text-[11px] text-secondary">terminal</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative py-1 font-mono text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-150',
                  isActive
                    ? 'text-primary after:absolute after:-bottom-[3px] after:left-0 after:h-[2px] after:w-full after:bg-accent'
                    : 'text-muted hover:text-secondary',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          {onTerminal && (
            <div className="flex items-center gap-2 border-l border-hairline pl-7">
              <span
                aria-hidden
                className="live-dot h-[6px] w-[6px] rounded-full bg-accent"
              />
              <span className="font-mono text-[11px] text-secondary">
                DATA AS OF {formatTimestamp(TERMINAL_STATS.dataAsOf).slice(11)}
              </span>
            </div>
          )}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center text-secondary lg:hidden"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={20} /> : <List size={20} />}
        </button>
      </div>

      {menuOpen && (
        <nav
          className="border-b border-hairline bg-base px-5 py-4 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-4">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'font-mono text-[11px] font-medium uppercase tracking-[0.12em]',
                      isActive ? 'text-primary' : 'text-muted',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
