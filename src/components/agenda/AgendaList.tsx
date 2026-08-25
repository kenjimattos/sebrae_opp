// Lista accordion de agendas da coluna esquerda da SectionAgendas.
// O painel externo (glass, raio e padding) é responsabilidade da seção —
// este componente só monta o conteúdo.

import type { Agenda } from '@/types/indicators'
import AgendaListItem from '@/components/agenda/AgendaListItem'
import { agendaStatus } from '@/utils/statusStyles'

interface AgendaListProps {
  agendas: Agenda[]
  descriptions?: Record<string, string>
  selectedId: string
  onSelect: (id: string) => void
  className?: string
}

export default function AgendaList({
  agendas,
  descriptions,
  selectedId,
  onSelect,
  className = '',
}: AgendaListProps) {
  return (
      <ul className={`flex flex-col h-full gap-md ${className}`}>
        {agendas.map((agenda, i) => (
          <li key={agenda.id} className={i > 0 ? '-mt-px' : ''}>
            <AgendaListItem
              title={agenda.name}
              description={descriptions?.[agenda.id]}
              status={agendaStatus(agenda)}
              expanded={selectedId === agenda.id}
              onToggle={() => onSelect(agenda.id)}
            />
          </li>
        ))}
      </ul>
  )
}
