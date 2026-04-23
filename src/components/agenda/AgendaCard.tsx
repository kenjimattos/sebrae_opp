// Figma: Agenda/Card (set 603:1874)
// White card with agenda title + list of indicators + objetivo tooltip

import type { Indicator } from '@/types/indicators'
import AgendaIndicator from '@/components/agenda/AgendaIndicator'
import Card from '@/components/ui/Card'
import InfoTooltip from '@/components/ui/InfoTooltip'
import { agendaObjectives } from '@/data/indicators/descriptions/agendas'

interface AgendaCardProps {
  id: string
  title: string
  indicators: Indicator[]
  className?: string
}

export default function AgendaCard({ id, title, indicators, className = '' }: AgendaCardProps) {
  const objetivo = agendaObjectives[id]

  return (
    <Card
      padding="md"
      className={`flex flex-col gap-lg card-hoverable ${className}`}
    >
      <div className="flex items-start justify-between gap-sm">
        <h3 className="typo-body-bold flex-1">
          {title}
        </h3>
        {objetivo && (
          <InfoTooltip
            trackingKey={`agenda_objetivo:${title}`}
            label={`Ver objetivo da agenda ${title}`}
            title="Objetivo"
            subtitle={objetivo}
          />
        )}
      </div>
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
    </Card>
  )
}
