// Figma: Section/Capacitacao (390:611)

import { useState } from 'react'
import { ChevronDown, ChevronUp } from '@/components/icons'
import { ICON_SIZES } from '@/constants/icons'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/SectionHeader'
import CoursesCard from '@/components/courses/CoursesCard'
import Button from '@/components/ui/buttons/Button'
import { sectionContent } from '@/data/sections'
import { trilhas } from '@/data/capacitacao'

const VISIBLE_COUNT = 2

export default function SectionCapacitacao() {
  const [expanded, setExpanded] = useState(false)
  const visibleTrilhas = expanded ? trilhas : trilhas.slice(0, VISIBLE_COUNT)

  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.capacitacao.title} />

      <div className="grid-2 w-full">
        {visibleTrilhas.map((trilha) => (
          <CoursesCard
            key={trilha.title}
            title={trilha.title}
            description={trilha.description}
            cursos={trilha.cursos}
          />
        ))}
      </div>

      {trilhas.length > VISIBLE_COUNT && (
        <div className="flex justify-center w-full mt-md">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setExpanded(!expanded)}
            className="gap-sm"
          >
            {expanded ? 'Ver menos trilhas' : `Ver todas as trilhas (${trilhas.length})`}
            {expanded ? <ChevronUp size={ICON_SIZES.md} /> : <ChevronDown size={ICON_SIZES.md} />}
          </Button>
        </div>
      )}
    </SectionContainer>
  )
}
