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
import InfoTooltip from '@/components/ui/InfoTooltip'
import { economicBaseDescriptions } from '@/data/indicators/descriptions/economic-base'

interface EconomicBaseCardProps {
  id: string
  label: string
  value: string
  variation: string
  icon?: string
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

export default function EconomicBaseCard({ id, label, value, variation, icon, className = '' }: EconomicBaseCardProps) {
  const Icon = icon ? iconMap[icon] : undefined
  const description = economicBaseDescriptions[id]

  return (
    <Card
      padding="md"
      className={`flex-col-start justify-between gap-lg card-hoverable ${className}`}
    >
      <div className="flex justify-start gap-sm w-full">
        <div className="flex items-center gap-sm w-full">
          {Icon && (
            <IconButton icon={Icon} size="sm" variant="tertiary" decorative />
          )}
          <span className="typo-body">
            {label}
          </span>
        </div>
        {description && (
          <InfoTooltip
            trackingKey={`base_economica_contexto:${label}`}
            label={`Ver definição de ${label}`}
            title={label}
            subtitle={description}
          />
        )}
      </div>
      <div className="flex items-end justify-between w-full">
        <span className="typo-display-sm">
          {value}
        </span>
        <span className="typo-body-sm-bold text-right">
          {variation}
        </span>
      </div>
    </Card>
  )
}
