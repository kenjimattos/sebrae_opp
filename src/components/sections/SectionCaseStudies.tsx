// Figma: Section/CasosSucesso (390:623)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import Carousel from '@/components/ui/Carousel'
import CaseStudiesCard from '@/components/case-studies/CaseStudiesCard'
import { sectionContent } from '@/data/home/sections'
import { caseStudies } from '@/data/home/case-studies'
import Card from '../ui/Card'
import TitleSubtitle from '../ui/TitleSubtitle'
import PillButton from '../ui/buttons/PillButton'

// CaseStudiesCard w-350 + gap-sm (12px)
const SCROLL_AMOUNT = 350 + 12

export default function SectionCaseStudies() {
  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.caseStudies.title} description={sectionContent.caseStudies.description} />

      <section className="flex flex-col gap-md">
        <Carousel scrollAmount={SCROLL_AMOUNT}>
          {caseStudies.map((caseStudy) => (
            <CaseStudiesCard key={caseStudy.id} caseStudy={caseStudy} className="snap-start" />
          ))}
        </Carousel>

        < Card as="section" padding="lg" className="flex flex-col items-end gap-2xl">
          <TitleSubtitle
            title="Comunidade de prática de Inovação em Políticas Públicas"
            subtitle="Espaço de troca e aprendizado para servidores públicos interessados em inovação, com eventos, conteúdos exclusivos e networking."
            className="flex-1"
          />
          <PillButton label="Entrar na comunidade" href="/comunidade" className="shrink-0" />
        </Card>
      </section>
    </SectionContainer>
  )
}
