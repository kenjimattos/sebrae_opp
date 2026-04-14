// Figma: CitySelector (509:3274)
// Pill-shaped selector showing current municipality with search icon

import { Search } from 'lucide-react'

interface CitySelectorProps {
  municipio: string
  className?: string
}

export default function CitySelector({ municipio, className = '' }: CitySelectorProps) {
  return (
    <div
      className={`flex items-center gap-[var(--spacing-sm)] bg-[var(--semantic-surface-secondary)] rounded-[var(--radius-full)] px-[var(--spacing-sm)] py-[var(--spacing-xs)] overflow-hidden ${className}`}
    >
      <Search size={24} className="shrink-0 text-[var(--semantic-text-primary)]" />
      <span className="typo-body-bold text-[color:var(--semantic-text-primary)] truncate">
        {municipio}
      </span>
    </div>
  )
}
