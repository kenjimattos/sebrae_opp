// Figma: Section/Capacitacao (390:611)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import CoursesCard from '@/components/courses/CoursesCard'
import { sectionContent } from '@/data/sections'
import { trilhas } from '@/data/capacitacao'


export default function SectionCapacitacao() {

  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.capacitacao.title} description={sectionContent.capacitacao.description}  />

        <section className="flex gap-sm overflow-x-auto w-full snap-x snap-mandatory scrollbar-hide py-xs px-xs -my-[var(--spacing-xs)]">
          {trilhas.map((trilha) => (
            <CoursesCard
              key={trilha.title}
              title={trilha.title}
              description={trilha.description}
              cursos={trilha.cursos}
            />
          ))}
        </section>

    </SectionContainer>
  )
}
