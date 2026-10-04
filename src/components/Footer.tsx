import { Link } from 'react-router'

/**
 * Footer (design.md §5.2). Top hairline, three zones: wordmark + exit line,
 * compliance line, nav repeat + data source attribution.
 */
export default function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-5 py-10 md:px-8 lg:grid-cols-3 lg:gap-8">
        <div>
          <p className="font-sans text-[15px] font-semibold tracking-[-0.01em] text-primary">
            igniise{' '}
            <span className="font-mono text-[11px] font-normal text-secondary">
              terminal
            </span>
          </p>
          <p className="mt-3 font-sans text-[13px] leading-[1.65] text-secondary">
            igniise is an independent intelligence practice.
          </p>
        </div>

        <p className="max-w-[52ch] font-mono text-[10.5px] leading-[1.7] text-muted">
          Igniise publishes cross-venue pricing observations for informational
          purposes. Nothing on this site constitutes investment advice, a
          solicitation, or an offer to transact in event contracts.
        </p>

        <div className="flex flex-col gap-4 lg:items-end">
          <nav aria-label="Footer">
            <ul className="flex gap-6">
              <li>
                <Link
                  to="/"
                  className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted transition-colors duration-150 hover:text-secondary"
                >
                  Manifesto
                </Link>
              </li>
              <li>
                <Link
                  to="/terminal"
                  className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted transition-colors duration-150 hover:text-secondary"
                >
                  Terminal
                </Link>
              </li>
              <li>
                <Link
                  to="/methodology"
                  className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted transition-colors duration-150 hover:text-secondary"
                >
                  Methodology
                </Link>
              </li>
            </ul>
          </nav>
          <p className="font-mono text-[10.5px] text-muted">
            Data sources: Polymarket, Kalshi
          </p>
        </div>
      </div>
    </footer>
  )
}
