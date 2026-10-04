import { useRef } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { TERMINAL_STATS } from '@/lib/data'
import { formatCount } from '@/lib/format'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const CLOSING_A = 'Prices are opinions.'.split(' ')
const CLOSING_B = 'Disagreement is data.'.split(' ')

interface CounterDef {
  target: number
  label: string
  format: (v: number) => string
  snap: number
}

const COUNTERS: CounterDef[] = [
  {
    target: TERMINAL_STATS.pairsTracked,
    label: 'PAIRS TRACKED',
    format: (v) => String(Math.round(v)),
    snap: 1,
  },
  {
    target: TERMINAL_STATS.discrepanciesLogged,
    label: 'DISCREPANCIES LOGGED',
    format: (v) => formatCount(Math.round(v)),
    snap: 1,
  },
  {
    target: TERMINAL_STATS.widerVenueClosedGapPct,
    label: 'RESOLUTIONS WHERE THE WIDER VENUE CLOSED THE GAP',
    format: (v) => `${v.toFixed(1)}%`,
    snap: 0.1,
  },
]

/**
 * Manifesto screen 3 (design.md v2 §5): live credibility + closing.
 * Stat pairs in the xfx pattern: mono value in ink, uppercase label in
 * muted, hairline-separated, counted once on entry. The page closes in
 * a register-invariant IGNIISE INK band: paper serif on deep green, the
 * white logo, and the single CTA intent.
 */
export default function Credibility() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set('.stat-rule', { scaleX: 0, transformOrigin: 'left center' })

        const trigger = {
          trigger: '.stat-row',
          start: 'top 80%',
          once: true,
        }

        gsap.to('.stat-rule', {
          scaleX: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: trigger,
        })

        // Count-ups drive mono text nodes directly (no per-frame re-render)
        gsap.utils.toArray<HTMLElement>('.stat-value').forEach((el, i) => {
          const def = COUNTERS[i]
          const obj = { val: 0 }
          el.textContent = def.format(0)
          gsap.to(obj, {
            val: def.target,
            duration: 1.4,
            delay: i * 0.12,
            ease: 'power2.out',
            snap: { val: def.snap },
            onUpdate: () => {
              el.textContent = def.format(obj.val)
            },
            scrollTrigger: trigger,
          })
        })

        gsap.set('.closing-word', { yPercent: 100 })
        gsap.to('.closing-word', {
          yPercent: 0,
          ease: 'none',
          stagger: 0.08,
          scrollTrigger: {
            trigger: '.closing',
            start: 'top 90%',
            end: 'top 55%',
            scrub: 0.6,
          },
        })

        gsap.set('.closing-cta', { opacity: 0, y: 16 })
        gsap.to('.closing-cta', {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.closing-cta',
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        })
      })
    },
    { scope },
  )

  return (
    <section ref={scope} className="relative">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-28 md:px-8 md:py-40">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
          LIVE FROM THE TERMINAL
        </p>

        <div className="stat-row mt-10 grid grid-cols-1 md:grid-cols-3">
          {COUNTERS.map((c, i) => (
            <div
              key={c.label}
              className={
                i === 0
                  ? 'pb-8 md:pb-0 md:pr-8'
                  : 'border-t border-hairline pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0'
              }
            >
              <div className="stat-rule h-px w-full bg-hairline md:hidden" />
              <p
                className="stat-value mt-4 font-mono font-medium text-primary md:mt-0"
                style={{ fontSize: 'clamp(40px, 5vw, 72px)' }}
              >
                {c.format(c.target)}
              </p>
              <p className="mt-3 max-w-[30ch] font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                {c.label}
              </p>
            </div>
          ))}
        </div>
        <div className="stat-rule mt-10 h-px w-full bg-hairline" />
        <p className="mt-4 font-sans text-[12px] text-muted">
          Figures read from the terminal at page render. The audit log shows
          the working.
        </p>

        <h2
          className="closing mt-24 max-w-[24ch] font-serif font-normal leading-[1.15] text-primary md:mt-32"
          style={{ fontSize: 'clamp(28px, 3.4vw, 44px)' }}
        >
          <span className="block overflow-hidden">
            {CLOSING_A.map((word, i) => (
              <span key={i} className="closing-word inline-block will-change-transform">
                {word}
                {i < CLOSING_A.length - 1 ? '\u00A0' : ''}
              </span>
            ))}
          </span>
          <span className="block overflow-hidden pb-1 italic leading-[1.1]">
            {CLOSING_B.map((word, i) => (
              <span key={i} className="closing-word inline-block will-change-transform">
                {word}
                {i < CLOSING_B.length - 1 ? '\u00A0' : ''}
              </span>
            ))}
          </span>
        </h2>
      </div>

      {/* Closing band: register-invariant IGNIISE INK. The dark surface
          carries the white logo and the single CTA intent. */}
      <div className="on-ink bg-[#123D2F] text-[#F2F0EB]">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-5 py-20 md:grid-cols-[1fr_auto] md:items-end md:px-8 md:py-28">
          <div>
            <img
              src="/logo-mark.png"
              alt=""
              className="logo-white h-12 w-12"
              width={48}
              height={48}
            />
            <p className="mt-8 max-w-[26ch] font-serif font-normal leading-[1.15] text-[#F2F0EB]"
              style={{ fontSize: 'clamp(26px, 3vw, 40px)' }}
            >
              Read both markets.
              <span className="block pb-1 italic leading-[1.1] text-[#F2F0EB]/85">
                Keep the receipt.
              </span>
            </p>
          </div>
          <div className="closing-cta flex flex-col items-start gap-4 md:items-end">
            <Link
              to="/terminal"
              className="group inline-flex h-11 items-center bg-[#F2F0EB] px-7 font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-[#123D2F] transition-colors duration-150 hover:bg-[#FFFFFF] active:translate-y-[1px]"
            >
              <span className="transition-transform duration-150 group-hover:translate-x-[2px]">
                Enter the Terminal
              </span>
              <span
                aria-hidden
                className="ml-2 transition-transform duration-150 group-hover:translate-x-[2px]"
              >
                &rarr;
              </span>
            </Link>
            <Link
              to="/methodology"
              className="font-sans text-[12px] text-[#F2F0EB]/65 underline underline-offset-4 transition-colors duration-150 hover:text-[#F2F0EB]"
            >
              Or read the methodology
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
