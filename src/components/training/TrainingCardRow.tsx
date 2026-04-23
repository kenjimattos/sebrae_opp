// Figma: Courses/CardRow (297:8)
// Row inside a course trail card — title (uppercase) + hours + "Ver curso" link

import PillButton from '@/components/ui/buttons/PillButton'

interface TrainingCardRowProps {
  title: string
  subtitle: string
  href?: string
  className?: string
}

export default function TrainingCardRow({ title, subtitle, href = '#', className = '' }: TrainingCardRowProps) {
  return (
    <div
      className={`flex-between w-full ${className}`}
    >
      {/* Info */}
      <div className="flex flex-col gap-xs items-start w-2/3">
        <p className="typo-body-bold">
          {title}
        </p>
        <p className="typo-body w-full">
          {subtitle}
        </p>
      </div>

      {/* Ver curso button */}
      <PillButton variant="ghost" size="sm" label="ver curso" href={href} />
    </div>
  )
}
