// Figma: Courses/CardRow (297:8)
// Row inside a course trail card — title (uppercase) + hours + "Ver curso" link

import PillButton from '@/components/ui/buttons/PillButton'
import { ctaLabels } from '@/data/labels'

interface CoursesCardRowProps {
  title: string
  subtitle: string
  className?: string
}

export default function CoursesCardRow({ title, subtitle, className = '' }: CoursesCardRowProps) {
  return (
    <div
      className={`flex-between gap-3xl px-sm py-sm ${className}`}
    >
      {/* Info */}
      <div className="flex flex-col gap-xs items-start">
        <p className="typo-body-bold w-full">
          {title}
        </p>
        <p className="typo-body w-full leading-[var(--spacing-md)]">
          {subtitle}
        </p>
      </div>

      {/* Ver curso button */}
      <PillButton size="sm" label={ctaLabels.verCurso} href="#" />
    </div>
  )
}
