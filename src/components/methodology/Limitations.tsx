import Reveal from './Reveal'

/**
 * Section 5: limitations + compliance statement (methodology.md §5).
 * Disclaimers lead, capabilities follow. Compliance-first audience.
 */

const LIMITATIONS: { lead: string; sentence: string }[] = [
  {
    lead: 'Not advice.',
    sentence:
      'Implied probabilities are venue quotes. Nothing here is a recommendation to transact.',
  },
  {
    lead: 'Not latency-grade.',
    sentence:
      'Quotes are polled at 60 seconds. Sub-minute discrepancies are invisible to this instrument.',
  },
  {
    lead: 'Not exhaustive.',
    sentence:
      'Only pairs passing the full verification pipeline appear. Unmatched venues and unverifiable contracts are excluded by design.',
  },
  {
    lead: 'Not infallible.',
    sentence:
      'The decision log above includes rejected proposals and reviewer corrections. Accuracy figures are computed against that public record.',
  },
]

export default function Limitations() {
  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <Reveal duration={0.55} amount={0.3}>
            <h2 className="font-sans text-2xl font-medium tracking-tight text-primary">
              What this terminal does not do
            </h2>
            <div className="mt-8 space-y-5">
              {LIMITATIONS.map((item) => (
                <p
                  key={item.lead}
                  className="font-sans text-[14px] leading-[1.65] text-secondary"
                >
                  <span className="font-semibold text-primary">{item.lead}</span>{' '}
                  {item.sentence}
                </p>
              ))}
            </div>
          </Reveal>
          <Reveal duration={0.55} delay={0.12} amount={0.3}>
            <div className="border border-hairline bg-inset p-6">
              <p className="font-sans text-[13px] leading-[1.7] text-secondary">
                Igniise publishes cross-venue pricing observations for
                informational purposes. Nothing on this site constitutes
                investment advice, a solicitation, or an offer to transact in
                event contracts. Prediction market data is referenced from
                public venue sources. igniise is an independent intelligence
                practice.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
