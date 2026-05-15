// Coluna esquerda da /new: heading "CONJUNTO DE INDICADORES" + lista
// accordion de agendas. Apenas uma expandida por vez (selectedId controlado
// pelo pai).

import type { Agenda } from '@/types/indicators'
import AgendaListItem from '@/components/agenda/AgendaListItem'

interface AgendaListProps {
  heading: string
  agendas: Agenda[]
  descriptions?: Record<string, string>
  selectedId: string
  onSelect: (id: string) => void
  className?: string
}

export default function AgendaList({
  heading,
  agendas,
  descriptions,
  selectedId,
  onSelect,
  className = '',
}: AgendaListProps) {
  return (
    <div className={`flex flex-col gap-lg ${className}`}>
      <h2 className="typo-display uppercase">{heading}</h2>
      <ul className="flex flex-col gap-2xs">
        {agendas.map((agenda) => (
          <li key={agenda.id}>
            <AgendaListItem
              title={agenda.name}
              description={descriptions?.[agenda.id]}
              expanded={selectedId === agenda.id}
              onToggle={() => onSelect(agenda.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
