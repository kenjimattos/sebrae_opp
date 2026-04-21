// Figma: Agenda/Card (set 603:1874)
// White card with agenda title + list of indicators + objetivo tooltip

import type { Indicador } from '@/types/indicadores'
import AgendaIndicator from '@/components/agenda/AgendaIndicator'
import Card from '@/components/ui/Card'
import Tooltip from '@/components/ui/Tooltip'
import { Info, iconSizes } from '@/components/icons'
import { agendaObjetivos } from '@/data/agenda-objetivos'

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
          <Tooltip
            content={
              <span className="flex flex-col gap-2xs">
                <span className="typo-body-sm-bold">Objetivo</span>
                <span className="typo-body-sm">{objetivo}</span>
              </span>
            }
          >
            <button
              type="button"
              aria-label={`Ver objetivo da agenda ${title}`}
              className="flex shrink-0 items-center justify-center text-[color:var(--semantic-text-inactive)] hover:text-[color:var(--semantic-accent)] transition-colors"
            >
              <Info size={iconSizes.sm} aria-hidden />
            </button>
          </Tooltip>
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
