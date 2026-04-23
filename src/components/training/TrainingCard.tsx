// Figma: Courses/Card (298:8)
// Trail card with title, description, course rows, and CTA button

import Card from '@/components/ui/Card'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import TrainingCardRow from '@/components/training/TrainingCardRow'
import PillButton from '../ui/buttons/PillButton'
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
    <Card
      as="section"
      padding="lg"
      className={`flex-col w-[480px] shrink-0 ${className}`}
    >
        <div className="flex-col-start gap-lg h-full">
          <TitleSubtitle title={title} subtitle={description} size="md" />

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

          <PillButton
            className="mt-auto"
            label={`Ver mais ${courses.length - VISIBLE_COUNT} cursos`}
            variant='secondary'
            href={trailHref}
          />
     </div>


    </Card>
  )
}
