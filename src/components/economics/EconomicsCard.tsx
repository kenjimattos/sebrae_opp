// Figma: Economics/Card (563:4015)
// Metric card: icon (32x32) + label (uppercase) + large value + variation

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, Building2, Users, ChartColumn, Briefcase, Landmark } from 'lucide-react'

interface EconomicsCardProps {
  label: string
  valor: string
  variacao: string
  icone?: string
  className?: string
}

const iconMap: Record<string, LucideIcon> = {
  'trending-up': TrendingUp,
  building: Building2,
  users: Users,
  'bar-chart': ChartColumn,
  briefcase: Briefcase,
  landmark: Landmark,
}

export default function EconomicsCard({ label, valor, variacao, icone, className = '' }: EconomicsCardProps) {
  const Icon = icone ? iconMap[icone] : undefined

  return (
    <div
      className={`flex flex-col items-start justify-between bg-[var(--semantic-surface-primary)] border border-solid border-[var(--semantic-surface-primary)] rounded-[var(--radius-sm)] p-[var(--spacing-md)] h-[172px] w-[230px] ${className}`}
    >
      <div className="flex items-center gap-[var(--spacing-sm)] w-full">
        {Icon && (
          <div className="shrink-0 size-[32px] rounded-full bg-[var(--semantic-surface-secondary)] flex items-center justify-center">
            <Icon size={16} className="text-[var(--semantic-text-primary)]" />
          </div>
        )}
        <span className="typo-h4 text-[color:var(--semantic-text-primary)]">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between w-full">
        <span className="typo-display-sm text-[color:var(--semantic-text-primary)] max-w-[130px]">
          {valor}
        </span>
        <span className="typo-body-bold text-[color:var(--semantic-text-primary)]">
          {variacao}
        </span>
      </div>
    </div>
  )
}
