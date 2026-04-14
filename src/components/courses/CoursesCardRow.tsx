// Figma: Courses/CardRow (297:8)
// Row inside a course trail card — title (uppercase) + hours + "Ver curso" link

import { ArrowRight } from 'lucide-react'

interface CoursesCardRowProps {
  title: string
  subtitle: string
  className?: string
}

export default function CoursesCardRow({ title, subtitle, className = '' }: CoursesCardRowProps) {
  return (
    <div
      className={`flex items-center justify-between pr-[var(--spacing-sm)] py-[var(--spacing-sm)] ${className}`}
    >
      {/* Info */}
      <div className="flex flex-col gap-[var(--spacing-sm)] items-start max-w-[290px] flex-1">
        <p className="typo-h4 uppercase text-[color:var(--semantic-text-primary)] w-full leading-normal">
          {title}
        </p>
        <p className="typo-body text-[color:var(--semantic-text-primary)] w-full leading-[var(--spacing-md)]">
          {subtitle}
        </p>
      </div>

      {/* Ver curso button */}
      <div className="flex items-center gap-[12px] h-[38px] pl-[var(--spacing-sm)] rounded-[var(--radius-full)] shrink-0">
        <span className="typo-button-sm text-[color:var(--semantic-text-primary)]">
          Ver curso
        </span>
        <span className="flex items-center justify-center w-[24px] h-[24px] bg-[var(--semantic-surface-secondary)] rounded-full shrink-0">
          <ArrowRight size={12} />
        </span>
      </div>
    </div>
  )
}
