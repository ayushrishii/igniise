import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Badge from '@/components/Badge'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * Manifesto screen 2: the mechanism (home.md §2). Pinned full-viewport stage,
 * scrub 1, end +=220%. Left 42% stage text (one visible at a time), right 58%
 * hairline pipeline diagram that draws itself with scroll. Below 768px and
 * under reduced motion: pin disabled, stages stack as static blocks.
 */
export default function Mechanism() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Pinned scrub sequence, desktop + full motion only
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.set('.dg-draw', { strokeDasharray: 100, strokeDashoffset: 100 })
        gsap.set(['.dg-tick-a', '.dg-tick-b', '.dg-axis-a', '.dg-axis-b'], {
          opacity: 0,
        })
        gsap.set('.dg-bracket', { scaleY: 0, transformOrigin: 'center center' })
        gsap.set(['.dg-spread-label', '.dg-seg', '.dg-sage'], { opacity: 0 })
        gsap.set('#dg-ledger-clip-rect', { attr: { width: 0 } })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: scope.current,
            start: 'top top',
            end: '+=220%',
            pin: true,
            scrub: 1,
          },
        })

        // 0-33%: Detect. Venue ticks land, spread bracket snaps in.
        tl.to('.dg-axis-a', { opacity: 1, duration: 0.04 }, 0)
          .to('.dg-axis-b', { opacity: 1, duration: 0.04 }, 0.02)
          .fromTo(
            '.dg-tick-a',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.06, ease: 'power3.out' },
            0.03,
          )
          .fromTo(
            '.dg-tick-b',
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.06, ease: 'power3.out' },
            0.06,
          )
          .to('.dg-seg-1', { opacity: 1, duration: 0.05 }, 0.08)
          .to('.dg-draw-1', { strokeDashoffset: 0, duration: 0.1 }, 0.08)
          .to('.dg-bracket', {
            scaleY: 1,
            duration: 0.06,
            ease: 'power3.out',
          }, 0.16)
          .to('.dg-spread-label', { opacity: 1, duration: 0.05 }, 0.2)

        // 33-66%: Verify. Stage crossfade, gate traces closed, check strokes in.
        tl.to('.mech-stage[data-stage="1"]', {
          opacity: 0,
          y: -24,
          duration: 0.09,
          ease: 'power2.in',
        }, 0.3)
          .fromTo(
            '.mech-stage[data-stage="2"]',
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.09, ease: 'power3.out' },
            0.39,
          )
          .to('.dg-seg-2', { opacity: 1, duration: 0.05 }, 0.4)
          .to('.dg-gate', { strokeDashoffset: 0, duration: 0.12 }, 0.42)
          .to('.dg-check', { strokeDashoffset: 0, duration: 0.07 }, 0.54)

        // 66-100%: Audit. Ledger row etches itself, sage delta marker lands.
        tl.to('.mech-stage[data-stage="2"]', {
          opacity: 0,
          y: -24,
          duration: 0.09,
          ease: 'power2.in',
        }, 0.63)
          .fromTo(
            '.mech-stage[data-stage="3"]',
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.09, ease: 'power3.out' },
            0.72,
          )
          .to('.dg-seg-3', { opacity: 1, duration: 0.05 }, 0.72)
          .to('#dg-ledger-clip-rect', { attr: { width: 150 }, duration: 0.16 }, 0.76)
          .to('.dg-sage', { opacity: 1, duration: 0.06 }, 0.92)
      })

      // Mobile: static stacked stages with light whileInView reveals
      mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('.mech-stage').forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          })
        })
      })
    },
    { scope },
  )

  return (
    <section ref={scope} className="relative border-t border-hairline">
      <div className="mech-wrap mx-auto w-full max-w-[1200px] px-5 py-28 md:px-8 md:py-0">
        <div className="grid w-full gap-16 md:grid-cols-[42%_58%] md:gap-10">
          {/* Stage text blocks: stacked static by default; absolutely layered
              only when the pinned sequence is active (see index.css) */}
          <div className="mech-stages flex flex-col gap-20 md:gap-0">
            <div className="mech-stage" data-stage="1">
              <h2
                className="font-serif font-normal leading-[1.06] text-primary"
                style={{ fontSize: 'clamp(30px, 3.6vw, 48px)' }}
              >
                Disagreement, measured.
              </h2>
              <p className="mt-5 max-w-[42ch] font-sans text-[15px] leading-[1.65] text-secondary">
                Two regulated venues price the same event. When implied
                probabilities diverge, the terminal logs the spread in points
                and timestamps both quotes.
              </p>
              <div className="mt-6">
                <MiniTickDiagram />
              </div>
            </div>

            <div className="mech-stage" data-stage="2">
              <span
                aria-hidden
                className="font-serif leading-none text-hairline-strong/70"
                style={{ fontSize: 'clamp(56px, 6vw, 84px)' }}
              >
                02
              </span>
              <h2
                className="mt-3 font-serif font-normal leading-[1.06] text-primary"
                style={{ fontSize: 'clamp(30px, 3.6vw, 48px)' }}
              >
                Matched by machine. Confirmed by hand.
              </h2>
              <p className="mt-5 max-w-[42ch] font-sans text-[15px] leading-[1.65] text-secondary">
                An agent proposes contract pairs across venues. A human audit
                confirms the resolution rules are identical before any pair is
                tracked.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Badge variant="verified" />
                <Badge variant="auto-matched" />
              </div>
            </div>

            <div className="mech-stage" data-stage="3">
              <h2
                className="font-serif font-normal leading-[1.06] text-primary"
                style={{ fontSize: 'clamp(30px, 3.6vw, 48px)' }}
              >
                Every call, on the record.
              </h2>
              <p className="mt-5 max-w-[42ch] font-sans text-[15px] leading-[1.65] text-secondary">
                When an event resolves, the terminal scores which venue sat
                closer to the outcome. The decision log, including its errors,
                is public.
              </p>
              <p className="mt-6 font-mono text-[11px] text-muted">
                2025-12-02 13:40 UTC &middot; RESOLUTION_SCORED &middot; CPI OCT
              </p>
            </div>
          </div>

          <PipelineDiagram />
        </div>
      </div>
    </section>
  )
}

/** Side stat for the Detect stage: two venue ticks on a shared scale. */
function MiniTickDiagram() {
  return (
    <div>
      <svg width="180" height="34" viewBox="0 0 180 34" aria-hidden>
        <line x1="8" y1="17" x2="172" y2="17" strokeWidth="1" style={{stroke: 'rgb(var(--c-hairline-strong))'}} />
        <line x1="126" y1="8" x2="126" y2="26" strokeWidth="1.5" style={{stroke: 'rgb(var(--c-primary))'}} />
        <line
          x1="107"
          y1="8"
          x2="107"
          y2="26"
         
          strokeWidth="1.5"
          strokeDasharray="3 3"
        style={{stroke: 'rgb(var(--c-muted))'}} />
      </svg>
      <p className="mt-2 font-mono text-[11px] text-secondary">
        62.0&cent; / 55.0&cent; &rarr;{' '}
        <span className="text-wide">7.0pt</span>
      </p>
    </div>
  )
}

/**
 * The pipeline diagram: venue price ticks converge into a spread bracket,
 * pass a verification gate, and etch a ledger row. Hand-built data-viz SVG
 * rendered in its final state by default; the pinned timeline un-draws and
 * re-draws it under scroll.
 */
function PipelineDiagram() {
  return (
    <div className="border border-hairline bg-inset p-4 md:self-center">
      <svg
        viewBox="0 0 560 300"
        className="h-auto w-full"
        role="img"
        aria-label="Pipeline diagram: two venue quotes converge into a spread, pass verification, and enter the audit ledger"
      >
        <defs>
          <clipPath id="dg-ledger-clip">
            <rect id="dg-ledger-clip-rect" x="416" y="126" width="150" height="120" />
          </clipPath>
        </defs>

        {/* Venue A row */}
        <g className="dg-axis-a">
          <text x="40" y="112" fontSize="9.5" fontFamily="Geist Mono, monospace" letterSpacing="1.4" style={{fill: 'rgb(var(--c-muted))'}}>
            POLYMARKET
          </text>
          <text x="40" y="132" fontSize="13" fontFamily="Geist Mono, monospace" style={{fill: 'rgb(var(--c-primary))'}}>
            62.0&cent;
          </text>
          <line x1="140" y1="124" x2="250" y2="124" strokeWidth="1" style={{stroke: 'rgb(var(--c-hairline-strong))'}} />
        </g>
        <g className="dg-tick-a dg-node">
          <line x1="200" y1="116" x2="200" y2="132" strokeWidth="1.5" style={{stroke: 'rgb(var(--c-primary))'}} />
        </g>

        {/* Venue B row */}
        <g className="dg-axis-b">
          <text x="40" y="176" fontSize="9.5" fontFamily="Geist Mono, monospace" letterSpacing="1.4" style={{fill: 'rgb(var(--c-muted))'}}>
            KALSHI
          </text>
          <text x="40" y="196" fontSize="13" fontFamily="Geist Mono, monospace" style={{fill: 'rgb(var(--c-secondary))'}}>
            55.0&cent;
          </text>
          <line x1="140" y1="188" x2="250" y2="188" strokeWidth="1" style={{stroke: 'rgb(var(--c-hairline-strong))'}} />
        </g>
        <g className="dg-tick-b dg-node">
          <line x1="181" y1="180" x2="181" y2="196" strokeWidth="1.5" strokeDasharray="3 3" style={{stroke: 'rgb(var(--c-muted))'}} />
        </g>

        {/* Converging paths into the spread bracket */}
        <g className="dg-seg dg-seg-1">
          <path
            className="dg-draw dg-draw-1"
            d="M200 124 C 240 124 258 140 288 152 M181 188 C 230 188 252 172 288 160"
            fill="none"
           
            strokeWidth="1"
            pathLength={100}
          style={{stroke: 'rgb(var(--c-hairline-strong))'}} />
        </g>
        <g className="dg-node">
          <line
            className="dg-bracket"
            x1="292"
            y1="136"
            x2="292"
            y2="176"
           
            strokeWidth="1.5"
          style={{stroke: 'rgb(var(--c-wide))'}} />
          <line className="dg-bracket" x1="292" y1="136" x2="286" y2="136" strokeWidth="1.5" style={{stroke: 'rgb(var(--c-wide))'}} />
          <line className="dg-bracket" x1="292" y1="176" x2="286" y2="176" strokeWidth="1.5" style={{stroke: 'rgb(var(--c-wide))'}} />
          <text className="dg-spread-label" x="304" y="160" fontSize="11" fontFamily="Geist Mono, monospace" style={{fill: 'rgb(var(--c-wide))'}}>
            7.0PT
          </text>
          <g className="dg-tip" opacity="0">
            <rect x="236" y="96" width="150" height="20" strokeWidth="1" style={{fill: 'rgb(var(--c-raised))', stroke: 'rgb(var(--c-hairline-strong))'}} />
            <text x="244" y="110" fontSize="9.5" fontFamily="Geist Mono, monospace" style={{fill: 'rgb(var(--c-secondary))'}}>
              GRID ROW: FED-DEC-25BP
            </text>
          </g>
        </g>

        {/* Link to the verification gate */}
        <line className="dg-seg dg-seg-2" x1="330" y1="156" x2="362" y2="156" strokeWidth="1" style={{stroke: 'rgb(var(--c-hairline-strong))'}} />

        {/* Verification gate */}
        <g className="dg-node">
          <rect
            className="dg-draw dg-gate"
            x="362"
            y="140"
            width="32"
            height="32"
            fill="none"
           
            strokeWidth="1.5"
            pathLength={100}
          style={{stroke: 'rgb(var(--c-accent-dim))'}} />
          <path
            className="dg-draw dg-check"
            d="M370 157 L376 164 L387 149"
            fill="none"
           
            strokeWidth="1.5"
            pathLength={100}
          style={{stroke: 'rgb(var(--c-wide))'}} />
          <g className="dg-tip" opacity="0">
            <rect x="330" y="110" width="96" height="20" strokeWidth="1" style={{fill: 'rgb(var(--c-raised))', stroke: 'rgb(var(--c-hairline-strong))'}} />
            <text x="338" y="124" fontSize="9.5" fontFamily="Geist Mono, monospace" style={{fill: 'rgb(var(--c-secondary))'}}>
              HUMAN AUDIT
            </text>
          </g>
        </g>

        {/* Link to the ledger */}
        <line className="dg-seg dg-seg-3" x1="394" y1="156" x2="416" y2="156" strokeWidth="1" style={{stroke: 'rgb(var(--c-hairline-strong))'}} />

        {/* Ledger row etching itself */}
        <g clipPath="url(#dg-ledger-clip)" className="dg-node">
          <text x="416" y="142" fontSize="9.5" fontFamily="Geist Mono, monospace" style={{fill: 'rgb(var(--c-muted))'}}>
            2025-12-03 14:32 UTC
          </text>
          <text x="416" y="160" fontSize="10" fontFamily="Geist Mono, monospace" style={{fill: 'rgb(var(--c-primary))'}}>
            PAIR_VERIFIED
          </text>
          <text x="416" y="178" fontSize="9.5" fontFamily="Geist Mono, monospace" style={{fill: 'rgb(var(--c-secondary))'}}>
            FED DEC 25BP CUT
          </text>
        </g>
        <g className="dg-sage">
          <rect x="416" y="196" width="8" height="8" style={{fill: 'rgb(var(--c-sage))'}} />
          <text x="430" y="204" fontSize="9.5" fontFamily="Geist Mono, monospace" style={{fill: 'rgb(var(--c-sage))'}}>
            VENUE A CLOSER 2.0PT
          </text>
        </g>
      </svg>
    </div>
  )
}
