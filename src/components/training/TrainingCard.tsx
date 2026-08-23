// Figma: Courses/Card (298:8)
// Trail card with title, description, course rows, and CTA button

import TitleSubtitle from '@/components/ui/TitleSubtitle'
import TrainingCardRow from '@/components/training/TrainingCardRow'
import Button from '../ui/buttons/Button'
import { courseAnchor, trailAnchor, type Course } from '@/data/home/training'

const VISIBLE_COUNT = 3

interface TrainingCardProps {
  slug: string
  title: string
  description: string
  courses: Course[]
  className?: string
}

export default function TrainingCard({ slug, title, description, courses, className = '' }: TrainingCardProps) {
  const visibleCourses = courses.slice(0, VISIBLE_COUNT)
  const trailHref = `/trilhas#${trailAnchor(slug)}`

  return (
    <div
      className={`flex flex-col border bg-surface p-md shrink-0 w-[40%] items-center justify-between gap-lg ${className}`}
    >
      <div className="flex flex-col gap-md">
        <TitleSubtitle title={title} subtitle={description} size="sm" />

        <div className="flex flex-col gap-sm w-full">
          {visibleCourses.map((course, i) => (
            <div key={course.title} className="flex-col-start gap-md ">
              <TrainingCardRow
                title={course.title}
                subtitle={course.duration}
                href={`/trilhas#${courseAnchor(slug, i)}`}
              />
              {i < visibleCourses.length - 1 && (
                <div className="divider mb-[var(--spacing-sm)]" />
              )}
            </div>
          ))}
        </div>
      </div>

      <Button
        label="Ver todos os cursos"
        variant="secondary"
        aria-label="Ir para a trilha"
        onClick={() => window.location.href = trailHref}
        className=""
      />
    </div>
  )
}
