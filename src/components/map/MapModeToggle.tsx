// Toggle segmentado "Meu município / Território" usado sobre o mapa na /new.
// Efeito glass com bevel visível: backdrop-blur + gradiente sutil + borda em
// gradiente (mais clara no topo, escura embaixo) via background-clip + sombra
// inset white no topo pra reforçar o highlight.

export type MapMode = 'municipio' | 'territorio'

interface MapModeToggleProps {
  value: MapMode
  onChange: (mode: MapMode) => void
  className?: string
}

const OPTIONS: { value: MapMode; label: string }[] = [
  { value: 'municipio', label: 'Meu município' },
  { value: 'territorio', label: 'Campina Grande' },
]

export default function MapModeToggle({ value, onChange, className = '' }: MapModeToggleProps) {
  return (
    <div
      className={`glass glass-bevel w-fit relative inline-flex items-center rounded-full ${className}`}
      role="tablist"
      aria-label="Modo de visualização do mapa"
    >
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={`rounded-full typo-button transition-colors whitespace-nowrap p-xs m-2xs ${
              isActive
                ? 'bg-accent text-black'
                : 'text-white hover:text-accent'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
