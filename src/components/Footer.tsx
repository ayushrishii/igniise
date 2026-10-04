import { Link } from 'react-router'

/**
 * Footer (design.md v2 §5). Register-invariant IGNIISE INK band (#123D2F):
 * the closing dark surface on both registers, and the fixed home of the
 * white logo assets. Paper text, muted paper metadata, hairlines in
 * paper at 18% alpha.
 */
export default function Footer() {
  return (
    <footer className="on-ink bg-[#123D2F] text-[#F2F0EB]">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-5 py-12 md:px-8 lg:grid-cols-3 lg:gap-8">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/logo-mark.png"
              alt=""
              className="logo-white h-8 w-8"
              width={32}
              height={32}
            />
            <img
              src="/logo-wordmark.png"
              alt="igniise"
              className="logo-white h-[18px] w-auto"
              height={18}
            />
            <span className="font-mono text-[11px] text-[#F2F0EB]/60">terminal</span>
          </div>
          <p className="mt-4 font-sans text-[13px] leading-[1.65] text-[#F2F0EB]/75">
            igniise is an independent intelligence practice.
          </p>
        </div>

        <p className="max-w-[52ch] font-mono text-[10.5px] leading-[1.7] text-[#F2F0EB]/55">
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
                  className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#F2F0EB]/60 transition-colors duration-150 hover:text-[#F2F0EB]"
                >
                  Manifesto
                </Link>
              </li>
              <li>
                <Link
                  to="/terminal"
                  className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#F2F0EB]/60 transition-colors duration-150 hover:text-[#F2F0EB]"
                >
                  Terminal
                </Link>
              </li>
              <li>
                <Link
                  to="/methodology"
                  className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#F2F0EB]/60 transition-colors duration-150 hover:text-[#F2F0EB]"
                >
                  Methodology
                </Link>
              </li>
            </ul>
          </nav>
          <p className="font-mono text-[10.5px] text-[#F2F0EB]/45">
            Data sources: Polymarket, Kalshi
          </p>
        </div>
      </div>
    </footer>
  )
}
