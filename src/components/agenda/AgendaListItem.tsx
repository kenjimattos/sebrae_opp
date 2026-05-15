// Item da AgendaList (accordion). Controlado: pai decide se está expandido.
// Expandido: título + descrição + seta →. Recolhido: só título + ícone +.

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
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="w-full text-left flex items-start gap-md p-md bg-[rgba(22,23,38,0.2)] border border-white/80 transition-colors hover:bg-[rgba(22,23,38,0.4)]"
    >
      <div className="flex-1 flex flex-col gap-sm">
        <span className="typo-h4 uppercase">{title}</span>
        {expanded && description && (
          <span className="typo-body-sm">{description}</span>
        )}
      </div>
      <span
        className="shrink-0 size-[22px] flex-center bg-white text-black"
        aria-hidden
      >
        {expanded ? '→' : '+'}
      </span>
    </button>
  )
}
