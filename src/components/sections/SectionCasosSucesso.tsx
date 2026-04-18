// Figma: Section/CasosSucesso (390:623)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import Carousel from '@/components/ui/Carousel'
import CaseStudiesCard from '@/components/case-studies/CaseStudiesCard'
import { sectionContent } from '@/data/sections'
import { casosSucesso } from '@/data/casos-sucesso'

// CaseStudiesCard w-350 + gap-sm (12px)
const SCROLL_AMOUNT = 350 + 12

export default function SectionCasosSucesso() {
  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.casosSucesso.title} description={sectionContent.casosSucesso.description} />

      <Carousel scrollAmount={SCROLL_AMOUNT}>
        {casosSucesso.map((caso) => (
          <CaseStudiesCard key={caso.id} caso={caso} className="snap-start" />
        ))}
      </Carousel>
    </SectionContainer>
  )
}
