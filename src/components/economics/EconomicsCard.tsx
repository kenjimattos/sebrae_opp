// Figma: Economics/Card (563:4015)
// Metric card: icon (32x32) + label (uppercase) + large value + variation

import {
  TrendingUp,
  Building2,
  Users,
  ChartColumn,
  Briefcase,
  Landmark,
  type LucideIcon,
} from '@/components/icons'
import Card from '@/components/ui/Card'
import IconButton from '@/components/ui/buttons/IconButton'

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
      className={`flex-col-start justify-between gap-lg card-hoverable ${className}`}
    >
      <div className="flex items-center gap-sm w-full">
        {Icon && (
          <IconButton icon={Icon} size="sm" variant="tertiary" decorative />
        )}
        <span className="typo-body">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between w-full">
        <span className="typo-display-sm">
          {valor}
        </span>
        <span className="typo-body-sm-bold text-right">
          {variacao}
        </span>
      </div>
    </Card>
  )
}
