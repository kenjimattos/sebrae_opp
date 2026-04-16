// Figma: Courses/Card (298:8)
// Trail card with title, description, course rows, and CTA button

import SectionCard from '@/components/ui/SectionCard'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import CoursesCardRow from '@/components/courses/CoursesCardRow'
import PillButton from '@/components/ui/buttons/PillButton'
import { ctaLabels } from '@/data/labels'

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
  return (
    <SectionCard padding="xl" className={`flex flex-col gap-lg items-start pb-2xl pt-xl h-full ${className}`}>
      <TitleSubtitle title={title} content={description} size="sm" />

      {/* Course rows — flex-1 pushes CTA to the bottom */}
      <div className="flex flex-col gap-sm items-start w-full flex-1">
        {cursos.map((curso, i) => (
          <div key={curso.titulo} className="w-full">
            {i > 0 && (
              <div className="divider mb-[var(--spacing-sm)]" />
            )}
            <CoursesCardRow title={curso.titulo} subtitle={curso.carga} />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-start justify-end w-full">
        <PillButton label={ctaLabels.verTrilhaCompleta} href="#" className="w-[325px]" />
      </div>
    </SectionCard>
  )
}
