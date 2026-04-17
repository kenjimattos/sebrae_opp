// Figma: Agenda/Card (set 603:1874)
// White card with agenda title + list of indicators

import type { Indicador } from '@/types/indicadores'
import AgendaIndicator from '@/components/agenda/AgendaIndicator'
import Card from '@/components/ui/Card'

interface AgendaCardProps {
  title: string
  indicadores: Indicador[]
  className?: string
}

export default function AgendaCard({ title, indicadores, className = '' }: AgendaCardProps) {
  return (
    <Card
      padding={{ x: 'md', y: 'lg' }}
      className={`flex flex-col gap-lg min-h-[384px] card-hoverable ${className}`}
    >
      <h3 className="typo-body-bold">
        {title}
      </h3>
      <div className="flex flex-col gap-sm flex-1">
        {indicadores.map((ind) => (
          <AgendaIndicator
            key={ind.label}
            label={ind.label}
            valor={ind.valor}
            status={ind.status}
          />
        ))}
      </div>
    </Card>
  )
}
