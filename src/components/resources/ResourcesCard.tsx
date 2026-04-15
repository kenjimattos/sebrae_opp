// Figma: Resources/Card (287:12)
// Gray card with title + large value

interface ResourcesCardProps {
  title: string
  value: string
  className?: string
}

export default function ResourcesCard({ title, value, className = '' }: ResourcesCardProps) {
  return (
    <div
      className={`flex flex-col gap-sm bg-[var(--semantic-surface-secondary)] rounded-[var(--radius-sm)] p-md w-[20dvh] justify-between ${className}`}
    >
      <span className="typo-body">
        {title}
      </span>
      <span className="typo-display-sm">
        {value}
      </span>
    </div>
  )
}
