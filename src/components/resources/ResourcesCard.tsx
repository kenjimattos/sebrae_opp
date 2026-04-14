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
      className={`flex flex-col gap-[var(--spacing-sm)] bg-[var(--semantic-surface-secondary)] rounded-[var(--radius-sm)] p-[var(--spacing-md)] ${className}`}
    >
      <span className="typo-body text-[color:var(--semantic-text-primary)]">
        {title}
      </span>
      <span className="typo-display-sm text-[color:var(--semantic-text-primary)]">
        {value}
      </span>
    </div>
  )
}
