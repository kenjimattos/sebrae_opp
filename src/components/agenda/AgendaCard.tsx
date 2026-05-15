// Card flutuante (estilo dark) usado na /new sobre o mapa: título da agenda
// + lista de indicadores (label + valor + IndicatorBar) + descrição no rodapé.

import type { Indicator } from '@/types/indicators'
import AgendaIndicator from '@/components/agenda/AgendaIndicator'
import Card from '@/components/ui/Card'

interface AgendaCardProps {
  title: string
  indicators: Indicator[]
  description?: string
  className?: string
}

export default function AgendaCard({
  title,
  indicators,
  description,
  className = '',
}: AgendaCardProps) {
  return (
    <Card
      surface="secondary"
      padding="md"
      className={`flex flex-col gap-md ${className}`}
    >
      <h3 className="typo-body-bold">{title}</h3>

      <div className="flex flex-col gap-sm flex-1">
        {indicators.map((ind) => (
          <AgendaIndicator
            key={ind.id ?? ind.label}
            id={ind.id}
            label={ind.label}
            value={ind.value}
            status={ind.status}
          />
        ))}
      </div>

      {description && (
        <p className="typo-body-sm text-inactive">{description}</p>
      )}
    </Card>
  )
}
