// Item da AgendaList (accordion). Expandido: título + descrição + botão →.
// Recolhido: só título + botão +. Cantos retos, borda branca 1px, fundo
// translúcido (rgba 22,23,38,0.2). Título em Monoblock Bold 16px uppercase.

import { Minus, Plus } from "lucide-react"
import IconButton from '@/components/ui/buttons/IconButton'

interface AgendaListItemProps {
  title: string
  description?: string
  expanded: boolean
  onToggle: () => void
}

export default function AgendaListItem({
  title,
  description,
  expanded,
  onToggle,
}: AgendaListItemProps) {
  return (
    <>
    <section
      aria-expanded={expanded}
      className="flex text-left border border-white justify-between gap-md items-center p-sm"
    >
      <p className="typo-h4 uppercase text-white">
        {title}
      </p>

      <IconButton
        variant="primary"
        size="sm"
        icon={expanded ? Minus : Plus}
        aria-label={expanded ? "Recolher" : "Expandir"}
        onClick={onToggle}
      />

    </section>
    {expanded && description && (
      <div className="border border-white p-sm">
        <p
          className="typo-body text-white"
        >
          {description}
        </p>
      </div>
    )}
    </>
  )
}
