import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { GhostButton, PrimaryButton } from '@/components/Button'
import { TICKER_ITEMS } from '@/lib/data'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import ParticleField from './ParticleField'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const LINE_1 = 'Two markets. Same event.'.split(' ')
const LINE_2 = 'Different truths.'.split(' ')

/**
 * Manifesto screen 1 (design.md v2 §5): the hook, in the xfx register.
 * Warm paper, ink serif, dotted vertical hairline columns organizing the
 * composition, and the particle field behind everything: one consensus
 * tearing into two venues, then a measured band. GSAP load sequence +
 * scroll-out drift; the field is scrubbed by the same scroll.
 */
export default function Hero() {
  const scope = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set('.hero-eyebrow', { opacity: 0, y: 12 })
        gsap.set('.hero-word', { yPercent: 110 })
        gsap.set('.hero-sub', { opacity: 0, y: 16 })
        gsap.set('.hero-cta', { opacity: 0, y: 12 })
        gsap.set('.hero-ticker-rule', { scaleX: 0 })

        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          delay: 0.15,
        })
        tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.5 })
          .to(
            '.hero-line-1 .hero-word',
            { yPercent: 0, duration: 0.9, stagger: 0.06 },
            '-=0.2',
          )
          .to(
            '.hero-line-2 .hero-word',
            { yPercent: 0, duration: 0.9, stagger: 0.06 },
            '-=0.55',
          )
          .to('.hero-sub', { opacity: 1, y: 0, duration: 0.6 }, '-=0.45')
          .to(
            '.hero-cta',
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
            '-=0.35',
          )
          .to(
            '.hero-ticker-rule',
            { scaleX: 1, duration: 0.8, transformOrigin: 'left center' },
            '-=0.2',
          )

        gsap.to('.hero-inner', {
          y: -60,
          opacity: 0.25,
          ease: 'none',
          scrollTrigger: {
            trigger: scope.current,
            start: 'top top',
            end: 'bottom 40%',
            scrub: true,
          },
        })
      })
    },
    { scope },
  )

  return (
    <section
      ref={scope}
      className="relative flex min-h-[100dvh] flex-col overflow-hidden"
    >
      {/* Dotted vertical hairline columns: the xfx grid, organizing the
          hero composition. They carry no content of their own on mobile. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden justify-center px-5 md:flex md:px-8"
      >
        <div className="flex h-full w-full max-w-[1200px]">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-full flex-1 border-l border-dotted border-hairline-strong/60" />
          ))}
          <div className="h-full border-l border-dotted border-hairline-strong/60" />
        </div>
      </div>

      {/* The disagreement, told in dots: sphere -> split -> band. */}
      <ParticleField trigger={scope} reducedMotion={reducedMotion} />

      <div className="relative mx-auto flex w-full max-w-[1200px] flex-1 items-center px-5 pb-28 pt-24 md:px-8">
        <div className="hero-inner max-w-[70%] md:max-w-none">
          <p className="hero-eyebrow font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            IGNIISE TERMINAL &middot; CROSS-VENUE INTELLIGENCE
          </p>
          <h1
            className="mt-6 font-serif font-normal leading-[1.04] tracking-[-0.02em] text-primary"
            style={{ fontSize: 'clamp(40px, 6.2vw, 92px)' }}
          >
            <span className="hero-line-1 block overflow-hidden">
              {LINE_1.map((word, i) => (
                <span
                  key={i}
                  className="hero-word inline-block will-change-transform"
                >
                  {word}
                  {i < LINE_1.length - 1 ? '\u00A0' : ''}
                </span>
              ))}
            </span>
            <span className="hero-line-2 block overflow-hidden pb-1 italic leading-[1.1]">
              {LINE_2.map((word, i) => (
                <span
                  key={i}
                  className="hero-word inline-block will-change-transform"
                >
                  {word}
                  {i < LINE_2.length - 1 ? '\u00A0' : ''}
                </span>
              ))}
            </span>
          </h1>
          <p className="hero-sub mt-8 max-w-[46ch] font-sans text-[15px] leading-[1.65] text-secondary">
            A terminal that measures disagreement between regulated prediction
            markets, pair by pair, point by point, against the public record.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <span className="hero-cta inline-flex">
              <PrimaryButton to="/terminal">Enter the Terminal</PrimaryButton>
            </span>
            <span className="hero-cta inline-flex">
              <GhostButton to="/methodology">Read the methodology</GhostButton>
            </span>
          </div>
        </div>
      </div>

      <Ticker reducedMotion={reducedMotion} />
    </section>
  )
}

/**
 * The page's one marquee: live spread tape on a 1px hairline at the viewport
 * bottom edge. 24px/s, pauses on hover, items route to the terminal with the
 * pair preselected. Reduced motion: static single-row wrap.
 */
function Ticker({ reducedMotion }: { reducedMotion: boolean }) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (reducedMotion || !measureRef.current) return
    const update = () => {
      const w = measureRef.current?.offsetWidth ?? 0
      if (w > 0) setDuration(w / 24)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [reducedMotion])

  const items = (
    <>
      {TICKER_ITEMS.map((item) => (
        <Link
          key={item.pairId}
          to={`/terminal?pair=${item.pairId}`}
          className="mr-8 font-mono text-[11px] text-muted transition-colors duration-150 hover:text-primary"
        >
          {item.label}
        </Link>
      ))}
    </>
  )

  return (
    <div className="hero-ticker-rule relative border-t border-hairline">
      {reducedMotion ? (
        <div className="flex flex-wrap gap-x-8 gap-y-2 px-5 py-3 md:px-8">
          {items}
        </div>
      ) : (
        <div className="group overflow-hidden py-3">
          <div
            className="ticker-track flex w-max group-hover:[animation-play-state:paused]"
            style={{
              animation: duration
                ? `ticker-scroll ${duration}s linear infinite`
                : undefined,
            }}
          >
            <div ref={measureRef} className="flex shrink-0 pl-5 md:pl-8">
              {items}
            </div>
            <div className="flex shrink-0 pl-5 md:pl-8" aria-hidden>
              {items}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
