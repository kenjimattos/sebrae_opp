// Figma: Section/Capacitacao (390:611)

import { useState } from 'react'
import { ChevronDown, ChevronUp } from '@/components/icons'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import CoursesCard from '@/components/courses/CoursesCard'
import Button from '@/components/ui/buttons/Button'
import { sectionContent } from '@/data/sections'
import { trilhas } from '@/data/capacitacao'

const VISIBLE_COUNT = 1

export default function SectionCapacitacao() {
  const [expanded, setExpanded] = useState(false)
  const visibleTrilhas = expanded ? trilhas : trilhas.slice(0, VISIBLE_COUNT)

  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.capacitacao.title} description={sectionContent.capacitacao.description}  />

      <section className="flex-col-start gap-md mb-lg">
        <section className="flex-col-start gap-md">
          {visibleTrilhas.map((trilha) => (
            <CoursesCard
              key={trilha.title}
              title={trilha.title}
              description={trilha.description}
              cursos={trilha.cursos}
            />
          ))}
        </section>

        {trilhas.length > VISIBLE_COUNT && (
          <div className="flex justify-center w-full mt-md">
            <Button
              variant="primary"
              size="md"
              label={expanded ? 'Ver menos trilhas' : `Ver todas as trilhas`}
              icon={expanded ? ChevronUp : ChevronDown}
              iconPosition="right"
              onClick={() => setExpanded(!expanded)}
            />
          </div>
        )}
      </section>
    </SectionContainer>
  )
}
