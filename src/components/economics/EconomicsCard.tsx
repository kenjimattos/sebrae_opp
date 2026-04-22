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
import { baseEconomicaContexto } from '@/data/base-economica-contexto'

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
  const contexto = baseEconomicaContexto[label]

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
        {contexto && (
          <InfoTooltip
            trackingKey={`base_economica_contexto:${label}`}
            label={`Ver definição de ${label}`}
            title={label}
            subtitle={contexto}
          />
        )}
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
