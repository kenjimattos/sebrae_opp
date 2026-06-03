// Shell de item expansível (accordion). Cabeçalho com título + botão toggle e
// caixa de conteúdo com borda branca 1px. A caixa aparece sempre que houver
// children; o consumidor decide o que mostrar conforme `expanded` (ex.:
// descrição recolhido, indicadores expandido). Cantos retos, título em
// Monoblock Bold 16px uppercase, glow conforme status.

import { Minus, Plus } from "lucide-react"
import IconButton from '@/components/ui/buttons/IconButton'
import type { StatusType } from '@/types/indicators'
import { statusStyles } from '@/utils/statusStyles'

interface AgendaExpandableProps {
  title: string
  status: StatusType
  expanded: boolean
  onToggle: () => void
  children?: React.ReactNode
  // Reserva 2 linhas para o título (line-clamp-2 + min-h). Use em grades de
  // altura uniforme (ex.: ModeEixos) para os headers ficarem todos do mesmo
  // tamanho. Default mantém o título no fluxo natural.
  clampTitle?: boolean
}

export default function AgendaExpandable({
  title,
  status,
  expanded,
  onToggle,
  children,
  clampTitle = false,
}: AgendaExpandableProps) {
  return (
    <>
    <section
      aria-expanded={expanded}
      className={`flex text-left border border-white justify-between gap-md items-center p-sm ${statusStyles[status].glow}`}
    >
      <p className={`typo-title-sm uppercase text-white${clampTitle ? ' line-clamp-2 min-h-[2lh]' : ''}`}>
        {title}
      </p>

      <IconButton
        variant="tertiary"
        size="sm"
        icon={expanded ? Minus : Plus}
        aria-label={expanded ? "Recolher" : "Expandir"}
        onClick={onToggle}
      />

    </section>
    {children && (
      <div className="border border-white p-sm">
        {children}
      </div>
    )}
    </>
  )
}
