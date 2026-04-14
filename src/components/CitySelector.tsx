// Figma: CitySelector (509:3274)
// Pill-shaped selector showing current municipality with search icon

interface CitySelectorProps {
  municipio: string
  className?: string
}

export default function CitySelector({ municipio, className = '' }: CitySelectorProps) {
  return (
    <div
      className={`flex items-center gap-[var(--spacing-sm)] bg-[var(--semantic-surface-secondary)] rounded-[var(--radius-full)] px-[var(--spacing-sm)] py-[var(--spacing-xs)] overflow-hidden ${className}`}
    >
      {/* Search icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[var(--semantic-text-primary)]">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="typo-body-bold text-[color:var(--semantic-text-primary)] truncate">
        {municipio}
      </span>
    </div>
  )
}
