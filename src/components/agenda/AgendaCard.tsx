// Figma: Agenda/Card (set 603:1874)
// White card with agenda title + list of indicators

import type { Indicador } from '@/types/indicadores'
import AgendaIndicator from '@/components/agenda/AgendaIndicator'

interface AgendaCardProps {
  title: string
  indicadores: Indicador[]
  className?: string
}

export default function AgendaCard({ title, indicadores, className = '' }: AgendaCardProps) {
  return (
    <div
      className={`flex flex-col gap-[var(--spacing-lg)] bg-[var(--semantic-surface-primary)] rounded-[var(--radius-sm)] px-[var(--spacing-md)] py-[var(--spacing-lg)] min-h-[384px] ${className}`}
    >
      <h3 className="typo-body-bold">
        {title}
      </h3>
      <div className="flex flex-col gap-[var(--spacing-sm)] flex-1">
        {indicadores.map((ind) => (
          <AgendaIndicator
            key={ind.label}
            label={ind.label}
            valor={ind.valor}
            status={ind.status}
          />
        ))}
      </div>
    </div>
  )
}
