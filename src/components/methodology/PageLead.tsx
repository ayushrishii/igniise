import { trpc } from '@/providers/trpc'
import { TERMINAL_STATS } from '@/lib/data'
import Reveal from './Reveal'

/**
 * Section 1: editorial lead (methodology.md §1). H1, 34-word sub, mono meta
 * strip. Live stat: pairs under human audit comes from terminal.stats,
 * falling back to the mock counter when the API is unavailable.
 */
export default function PageLead() {
  const stats = trpc.terminal.stats.useQuery()
  const pairsUnderAudit =
    stats.data && stats.data.pairsTracked > 0
      ? stats.data.pairsTracked
      : TERMINAL_STATS.pairsTracked

  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 pb-16 pt-24 md:px-8">
        <Reveal duration={0.6} amount={0.4}>
          <h1 className="max-w-[16ch] font-sans text-3xl font-medium leading-[1.08] tracking-[-0.02em] text-primary md:text-[44px]">
            How a pair earns its place on the grid.
          </h1>
        </Reveal>
        <Reveal duration={0.6} delay={0.1} amount={0.4}>
          <p className="mt-6 max-w-[60ch] font-sans text-[15px] leading-[1.65] text-secondary">
            Every tracked pair passes automated discovery, human verification,
            and a resolution-rule audit. Every decision the system makes,
            including the ones it gets wrong, is logged publicly below.
          </p>
        </Reveal>
        <Reveal duration={0.6} delay={0.2} amount={0.4}>
          <div className="mt-10 border-t border-hairline pt-4">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
              <span>Last full review Nov 12</span>
              <span className="inline-block w-6" aria-hidden />
              <span>Pairs under human audit {pairsUnderAudit}</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
