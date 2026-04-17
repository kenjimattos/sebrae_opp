// Figma: Resources/Card (287:12)
// Gray card with title + large value

import Card from '@/components/ui/Card'

interface ResourcesCardProps {
  title: string
  value: string
  className?: string
}

export default function ResourcesCard({ title, value, className = '' }: ResourcesCardProps) {
  return (
    <Card
      surface="secondary"
      padding="md"
      className={`flex flex-col gap-sm justify-between card-hoverable ${className}`}
    >
      <span className="typo-body">
        {title}
      </span>
      <span className="typo-display-sm">
        {value}
      </span>
    </Card>
  )
}
