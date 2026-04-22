// Figma: Agenda/Card (set 603:1874)
// White card with agenda title + list of indicators + objetivo tooltip

import type { Indicador } from '@/types/indicadores'
import AgendaIndicator from '@/components/agenda/AgendaIndicator'
import Card from '@/components/ui/Card'
import InfoTooltip from '@/components/ui/InfoTooltip'
import { agendaObjetivos } from '@/data/indicadores/descricoes/agendas'

interface AgendaCardProps {
  title: string
  indicadores: Indicador[]
  className?: string
}

export default function AgendaCard({ title, indicadores, className = '' }: AgendaCardProps) {
  const objetivo = agendaObjetivos[title]

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
        {indicadores.map((ind) => (
          <AgendaIndicator
            key={ind.id ?? ind.label}
            id={ind.id}
            label={ind.label}
            valor={ind.valor}
            status={ind.status}
          />
        ))}
      </div>
    </Card>
  )
}
