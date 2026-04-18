// Figma: Section/Capacitacao (390:611)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import Carousel from '@/components/ui/Carousel'
import CoursesCard from '@/components/courses/CoursesCard'
import { sectionContent } from '@/data/sections'
import { trilhas } from '@/data/capacitacao'

// CoursesCard w-480 + gap-sm (12px)
const SCROLL_AMOUNT = 480 + 12

export default function SectionCapacitacao() {
  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.capacitacao.title} description={sectionContent.capacitacao.description} />

      <Carousel scrollAmount={SCROLL_AMOUNT}>
        {trilhas.map((trilha) => (
          <CoursesCard
            key={trilha.slug}
            slug={trilha.slug}
            title={trilha.title}
            description={trilha.description}
            cursos={trilha.cursos}
            className="snap-start"
          />
        ))}
      </Carousel>
    </SectionContainer>
  )
}
