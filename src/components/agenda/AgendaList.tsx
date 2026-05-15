// Coluna esquerda da /new: heading display + lista accordion de agendas.
// O container externo (rounded-[25px], bg translúcido) é responsabilidade da
// página — este componente só monta o conteúdo.

import type { Agenda } from '@/types/indicators'
import AgendaListItem from '@/components/agenda/AgendaListItem'

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
    <div className={`flex flex-col ${className}`}>
      <h2
        className="text-[56px] leading-normal uppercase text-white"
        style={{ fontFamily: 'var(--font-headings)', fontWeight: 800 }}
      >
        Conjunto de
        <br />
        indicadores
      </h2>

      <ul className="flex flex-col mt-[28px]">
        {agendas.map((agenda, i) => (
          <li key={agenda.id} className={i > 0 ? '-mt-px' : ''}>
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
