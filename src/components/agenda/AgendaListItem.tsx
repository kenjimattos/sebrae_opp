// Item da AgendaList (accordion). Expandido: título + descrição + botão →.
// Recolhido: só título + botão +. Cantos retos, borda branca 1px, fundo
// translúcido (rgba 22,23,38,0.2). Título em Monoblock Bold 16px uppercase.

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
      className="w-full text-left relative bg-[rgba(22,23,38,0.2)] border border-white transition-colors hover:bg-[rgba(22,23,38,0.4)]"
      style={{ minHeight: 71 }}
    >
      <div className="px-[16px] pt-[18px] pb-[18px] pr-[60px]">
        <p
          className="text-[16px] uppercase leading-normal text-white"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
        >
          {title}
        </p>
        {expanded && description && (
          <p
            className="mt-[24px] text-[12px] leading-normal text-white"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {description}
          </p>
        )}
      </div>

      <span
        className="absolute top-[24px] right-[21px] size-[22px] inline-flex items-center justify-center bg-white text-black"
        aria-hidden
      >
        {expanded ? (
          <svg width="13" height="10" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 5H12M12 5L8 1M12 5L8 9" stroke="black" strokeWidth="1.5" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.5 0V13M0 6.5H13" stroke="black" strokeWidth="1.5" />
          </svg>
        )}
      </span>
    </button>
  )
}
