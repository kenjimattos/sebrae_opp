// Figma: Section/Capacitacao (390:611)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/SectionHeader'
import CoursesCard from '@/components/courses/CoursesCard'
import { sectionContent } from '@/data/sections'
import { trilhas } from '@/data/capacitacao'

export default function SectionCapacitacao() {
  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.capacitacao.title} />

      {/* Grid 2x2 with graduation cap icon in center */}
      <div className="grid-2 w-full">
        {trilhas.map((trilha) => (
          <CoursesCard
            key={trilha.title}
            title={trilha.title}
            description={trilha.description}
            cursos={trilha.cursos}
          />
        ))}
      </div>
    </SectionContainer>
  )
}
