// Figma: Courses/Card (298:8)
// Trail card with title, description, course rows, and CTA button

import Card from '@/components/ui/Card'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import CoursesCardRow from '@/components/courses/CoursesCardRow'
import Button from '../ui/buttons/Button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const VISIBLE_COUNT = 2

interface Curso {
  titulo: string
  carga: string
}

interface CoursesCardProps {
  title: string
  description: string
  cursos: Curso[]
  className?: string
}

export default function CoursesCard({ title, description, cursos, className = '' }: CoursesCardProps) {
  const [expanded, setExpanded] = useState(false)
  const visibleCursos = expanded ? cursos : cursos.slice(0, VISIBLE_COUNT)
  
  return (
    <Card
      as="section"
      padding="xl"
      className={`flex flex-col gap-lg items-start h-full w-full ${className}`}
    >
      <TitleSubtitle title={title} subtitle={description} size="md" />

      {/* Course rows — flex-1 pushes CTA to the bottom */}
      <div className="flex flex-col gap-sm items-start w-full flex-1 px-lg">
        {visibleCursos.map((curso, i) => (
          <div key={curso.titulo} className="w-full">
            {i > 0 && (
              <div className="divider mb-[var(--spacing-sm)]" />
            )}
            <CoursesCardRow title={curso.titulo} subtitle={curso.carga} />
          </div>
        ))}

      {cursos.length > VISIBLE_COUNT && (
        <div className="flex justify-center w-full mt-md">
          <Button
            variant="tertiary"
            size="md"
            label={expanded ? 'Ver menos cursos' : `Ver trilha completa (${cursos.length})`}
            icon={expanded ? ChevronUp : ChevronDown}
            iconPosition="right"
            onClick={() => setExpanded(!expanded)}
          />
        </div>
      )}
      </div>
    </Card>
  )
}
