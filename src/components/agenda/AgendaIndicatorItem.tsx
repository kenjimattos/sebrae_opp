// Item da agenda que usa o shell AgendaExpandable. Recolhido mostra a descrição
// (igual ao AgendaListItem); expandido troca pelas linhas de AgendaIndicator
// (barra rainbow), separadas por divisor tracejado — mesmo tratamento do
// AgendaCard flutuante.

import AgendaExpandable from '@/components/agenda/AgendaExpandable'
import AgendaIndicator from '@/components/agenda/AgendaIndicator'
import type { Indicator, StatusType } from '@/types/indicators'

interface AgendaIndicatorItemProps {
  title: string
  indicators: Indicator[]
  status: StatusType
  expanded: boolean
  onToggle: () => void
  description?: string
}

export default function AgendaIndicatorItem({
  title,
  indicators,
  status,
  expanded,
  onToggle,
  description,
}: AgendaIndicatorItemProps) {
  return (
    <AgendaExpandable
      title={title}
      status={status}
      expanded={expanded}
      onToggle={onToggle}
    >
      {expanded ? (
        <div className="flex flex-col">
          {indicators.map((ind, i) => (
            <div key={ind.id ?? ind.label} className="flex flex-col">
              <AgendaIndicator
                id={ind.id}
                label={ind.label}
                value={ind.value}
                status={ind.status}
                className={i < indicators.length - 1 ? 'pb-xs' : ''}
              />

              {i < indicators.length - 1 && (
                <hr className="border-accent border-dashed pb-xs" />
              )}
            </div>
          ))}
        </div>
      ) : (
        description && <p className="typo-body-sm">{description}</p>
      )}
    </AgendaExpandable>
  )
}
