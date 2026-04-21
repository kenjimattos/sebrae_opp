// Figma: Courses/Card (298:8)
// Trail card with title, description, course rows, and CTA button

import Card from '@/components/ui/Card'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import CoursesCardRow from '@/components/courses/CoursesCardRow'
import PillButton from '../ui/buttons/PillButton'
import { cursoAnchor, trilhaAnchor, type Curso } from '@/data/capacitacao'

const VISIBLE_COUNT = 3

interface CoursesCardProps {
  slug: string
  title: string
  description: string
  cursos: Curso[]
  className?: string
}

export default function CoursesCard({ slug, title, description, cursos, className = '' }: CoursesCardProps) {
  const visibleCursos = cursos.slice(0, VISIBLE_COUNT)
  const trilhaHref = `/trilhas#${trilhaAnchor(slug)}`

  return (
    <Card
      as="section"
      padding="lg"
      className={`flex-col w-[480px] shrink-0 ${className}`}
    >
        <div className="flex-col-start gap-lg h-full">
          <TitleSubtitle title={title} subtitle={description} size="md" />

          <div className="flex flex-col gap-sm w-full">
              {visibleCursos.map((curso, i) => (
                <div key={curso.titulo} className="flex-col-start gap-md ">
                  <CoursesCardRow
                    title={curso.titulo}
                    subtitle={curso.carga}
                    href={`/trilhas#${cursoAnchor(slug, i)}`}
                  />
                  {i < visibleCursos.length - 1 && (
                    <div className="divider mb-[var(--spacing-sm)]" />
                  )}
                </div>
              ))}
          </div>

          <PillButton
            className="mt-auto"
            label={`Ver mais ${cursos.length - VISIBLE_COUNT} cursos`}
            variant='secondary'
            href={trilhaHref}
          />
     </div>


    </Card>
  )
}
