// Figma: Courses/CardRow (297:8)
// Row inside a course trail card — title (uppercase) + hours + "Ver curso" link

import { useNavigate } from 'react-router-dom'
import IconButton from '@/components/ui/buttons/IconButton'
import { ArrowRight } from '@/components/icons'

interface TrainingCardRowProps {
  title: string
  subtitle: string
  href?: string
  className?: string
}

export default function TrainingCardRow({ title, subtitle, href = '#', className = '' }: TrainingCardRowProps) {
  const navigate = useNavigate()

  return (
    <div
      className={`flex-between w-full ${className}`}
    >
      {/* Info */}
      <div className="flex flex-col gap-xs items-start w-2/3">
        <p className="typo-body-sm-bold">
          {title}
        </p>
        <p className="typo-body-sm w-full">
          {subtitle}
        </p>
      </div>

      {/* Ver curso button */}
      <IconButton icon={ArrowRight} size="sm" onClick={() => navigate(href)} />
    </div>
  )
}
