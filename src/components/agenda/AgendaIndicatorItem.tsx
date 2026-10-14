// Item da agenda que usa o shell AgendaExpandable. Recolhido mostra a descrição;
// expandido troca pela AgendaIndicatorList, cujo label abre o modal "IA" do
// indicador quando o chamador passa `onIndicatorClick`.

import AgendaExpandable from '@/components/agenda/AgendaExpandable'
import AgendaIndicatorList from '@/components/agenda/AgendaIndicatorList'
import type { Indicator, StatusType } from '@/types/indicators'

interface AgendaIndicatorItemProps {
  title: string
  indicators: Indicator[]
  status: StatusType
  expanded: boolean
  onToggle: () => void
  description?: string
  onIndicatorClick?: (indicator: Indicator) => void
}

export default function AgendaIndicatorItem({
  title,
  indicators,
  status,
  expanded,
  onToggle,
  description,
  onIndicatorClick,
}: AgendaIndicatorItemProps) {
  return (
    <AgendaExpandable
      title={title}
      status={status}
      expanded={expanded}
      onToggle={onToggle}
      clampTitle
      fill
    >
      {expanded ? (
        <AgendaIndicatorList indicators={indicators} onIndicatorClick={onIndicatorClick} />
      ) : (
        description && (
          // Reserva 4 linhas para a descrição recolhida → todos os cards fechados
          // têm a mesma altura e o masonry alinha as colunas. line-clamp evita que
          // descrições longas estourem a reserva (corta com reticências).
          <p className="typo-body-sm line-clamp-4 min-h-[4lh]">{description}</p>
        )
      )}
    </AgendaExpandable>
  )
}
