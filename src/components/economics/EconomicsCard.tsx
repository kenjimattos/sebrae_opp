// Figma: Economics/Card (563:4015)
// Metric card: icon (32x32) + label (uppercase) + large value + variation

import {
  TrendingUp,
  Building2,
  Users,
  ChartColumn,
  Briefcase,
  Landmark,
  iconSizes,
  type LucideIcon,
} from '@/components/icons'
import Card from '@/components/ui/Card'

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
    <Card
      padding="md"
      className={`flex-col-start justify-between h-[172px] card-hoverable ${className}`}
    >
      <div className="flex items-center gap-sm w-full">
        {Icon && (
          <div className="shrink-0 size-[32px] radius-full bg-surface-secondary flex items-center justify-center">
            <Icon size={iconSizes.sm} className="text-[var(--semantic-text-primary)]" />
          </div>
        )}
        <span className="typo-h4">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between w-full">
        <span className="typo-display-sm max-w-[130px]">
          {valor}
        </span>
        <span className="typo-body-sm-bold">
          {variacao}
        </span>
      </div>
    </Card>
  )
}
