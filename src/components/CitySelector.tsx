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
      className={`flex items-center gap-sm bg-[var(--semantic-surface-secondary)] rounded-[var(--radius-full)] px-sm py-xs overflow-hidden ${className}`}
    >
      <Search size={24} className="shrink-0 text-[var(--semantic-text-primary)]" />
      <span className="typo-body-bold truncate">
        {municipio}
      </span>
    </div>
  )
}
