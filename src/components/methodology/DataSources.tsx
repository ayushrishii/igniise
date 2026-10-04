import Reveal from './Reveal'

/**
 * Section 3: data sources band (methodology.md §3). Full-width bg-raised
 * surface between hairlines, two venue blocks plus an independence line.
 */

function VenueBlock({
  name,
  descriptor,
}: {
  name: string
  descriptor: string
}) {
  return (
    <div>
      <h3 className="font-sans text-[15px] font-semibold text-primary">
        {name}
      </h3>
      <p className="mt-2 font-sans text-[13px] leading-[1.65] text-secondary">
        {descriptor}
      </p>
      <div className="mt-4 space-y-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">
        <p>Endpoint: public market data</p>
        <p>Poll: 60s</p>
        <p>Fields: mid, last, resolution</p>
      </div>
    </div>
  )
}

export default function DataSources() {
  return (
    <section className="border-y border-hairline bg-raised">
      <Reveal duration={0.5} amount={0.3} y={16}>
        <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <VenueBlock
              name="Polymarket"
              descriptor="Regulated event contract venue. Public market data polled at 60-second intervals."
            />
            <VenueBlock
              name="Kalshi"
              descriptor="Regulated event contract venue, CFTC-supervised. Public market data polled at 60-second intervals."
            />
          </div>
          <p className="mt-10 font-sans text-[12px] leading-[1.65] text-muted">
            Igniise reads public pricing data only. No venue affiliation, no
            commercial relationship, no order flow.
          </p>
        </div>
      </Reveal>
    </section>
  )
}
