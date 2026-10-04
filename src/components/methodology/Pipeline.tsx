import type { ReactNode } from 'react'
import Badge from '@/components/Badge'
import Reveal from './Reveal'

/**
 * Section 2: the verification pipeline (methodology.md §2). Asymmetric
 * two-column layout: three verb-labeled stage blocks left, sticky pair
 * requirements spec sheet right (unsticks and stacks below on mobile).
 */

const STAGES: { verb: string; body: string }[] = [
  {
    verb: 'Detect.',
    body: 'A discovery agent scans both venues hourly and proposes candidate pairs by matching event semantics: identical underlying outcome, identical resolution source, identical expiry window. Proposals carry a confidence score and the evidence that produced them.',
  },
  {
    verb: 'Verify.',
    body: 'A human reviewer confirms that both contracts resolve against the same authoritative source with the same settlement definition. Pairs that diverge on any resolution rule are rejected, and the rejection is logged with reasoning. Only confirmed pairs carry the verified mark.',
  },
  {
    verb: 'Audit.',
    body: "After resolution, the terminal scores which venue's final-week pricing sat closer to the outcome. Scores feed the resolution accuracy counter shown on the manifesto. Errors stay in the log. Nothing is backfilled.",
  },
]

const REQUIREMENTS: { value: string; gloss: string }[] = [
  { value: 'SAME SOURCE', gloss: 'both contracts resolve to one authority' },
  { value: 'SAME WINDOW', gloss: 'expiry within 24h of each other' },
  { value: 'SAME DEFINITION', gloss: 'identical settlement wording' },
  { value: '\u2265 2.0PT', gloss: 'minimum logged discrepancy' },
  { value: '60S', gloss: 'venue quote poll interval' },
]

function StageBlock({
  verb,
  body,
  first,
  children,
}: {
  verb: string
  body: string
  first?: boolean
  children?: ReactNode
}) {
  return (
    <Reveal
      duration={0.55}
      amount={0.35}
      className={first ? undefined : 'mt-8 border-t border-hairline pt-8'}
    >
      <h3 className="font-sans text-lg font-semibold text-primary">{verb}</h3>
      <p className="mt-3 max-w-[58ch] font-sans text-[15px] leading-[1.65] text-secondary">
        {body}
      </p>
      {children}
    </Reveal>
  )
}

export default function Pipeline() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_360px]">
        <div>
          <StageBlock verb={STAGES[0].verb} body={STAGES[0].body} first>
            <div className="mt-4">
              <span className="inline-flex h-6 items-center border border-hairline px-2 font-mono text-[10px] uppercase tracking-[0.1em] text-secondary">
                Fed decision {'\u00B7'} conf 0.94
              </span>
            </div>
          </StageBlock>
          <StageBlock verb={STAGES[1].verb} body={STAGES[1].body}>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="verified" />
              <Badge variant="auto-matched" />
            </div>
          </StageBlock>
          <StageBlock verb={STAGES[2].verb} body={STAGES[2].body} />
        </div>

        <Reveal
          duration={0.6}
          amount={0.35}
          y={0}
          x={24}
          className="md:sticky md:top-24 md:self-start"
        >
          <div className="border border-hairline bg-raised p-4">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
              Pair requirements
            </p>
            <dl className="mt-3">
              {REQUIREMENTS.map((row, i) => (
                <div
                  key={row.value}
                  className={
                    i === 0
                      ? 'flex items-baseline justify-between gap-4 py-2.5'
                      : 'flex items-baseline justify-between gap-4 border-t border-hairline py-2.5'
                  }
                >
                  <dt className="shrink-0 font-mono text-[11px] text-primary">
                    {row.value}
                  </dt>
                  <dd className="text-right font-sans text-[11px] leading-[1.5] text-secondary">
                    {row.gloss}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
