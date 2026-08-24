// Item da agenda que usa o shell AgendaExpandable. Recolhido mostra a descrição
// (igual ao AgendaListItem); expandido troca pela AgendaIndicatorList — a mesma
// que o AgendaCard flutuante renderiza, agora por compartilhamento e não por
// cópia mantida à mão.

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
      clampTitle
      fill
    >
      {expanded ? (
        // Sem onIndicatorClick: no modo Eixos o label não abre o modal "IA",
        // ao contrário do card flutuante. A divergência é anterior a esta
        // extração e foi preservada como estava.
        <AgendaIndicatorList indicators={indicators} />
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
