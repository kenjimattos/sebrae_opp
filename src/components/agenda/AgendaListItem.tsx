// Item da AgendaList: usa o shell AgendaExpandable e preenche a área expandida
// com a descrição da agenda (font-body-sm).

import AgendaExpandable from '@/components/agenda/AgendaExpandable'
import type { StatusType } from '@/types/indicators'

interface AgendaListItemProps {
  title: string
  description?: string
  status: StatusType
  expanded: boolean
  onToggle: () => void
}

export default function AgendaListItem({
  title,
  description,
  status,
  expanded,
  onToggle,
}: AgendaListItemProps) {
  return (
    <AgendaExpandable
      title={title}
      status={status}
      expanded={expanded}
      onToggle={onToggle}
    >
      {expanded && description && <p className="typo-body-sm">{description}</p>}
    </AgendaExpandable>
  )
}
