import PageLead from '@/components/methodology/PageLead'
import Pipeline from '@/components/methodology/Pipeline'
import DataSources from '@/components/methodology/DataSources'
import DecisionLog from '@/components/methodology/DecisionLog'
import Limitations from '@/components/methodology/Limitations'

/**
 * Methodology (`/methodology`): verification pipeline, data sources, public
 * agent decision log, limitations (design.md, methodology.md). Geist prose,
 * Geist Mono data, no serif. Motion via motion/react whileInView only.
 */
export default function Methodology() {
  return (
    <>
      <PageLead />
      <Pipeline />
      <DataSources />
      <DecisionLog />
      <Limitations />
    </>
  )
}
