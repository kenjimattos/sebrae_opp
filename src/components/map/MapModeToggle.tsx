// Toggle segmentado "Meu município / Território" usado sobre o mapa na /new.
// Background usa o SVG corner-gradient (matriz de retângulos refletidos) do
// Figma, com opção ativa preenchida em accent (#D4FE07).

export type MapMode = 'municipio' | 'territorio'

interface MapModeToggleProps {
  value: MapMode
  onChange: (mode: MapMode) => void
  className?: string
}

const OPTIONS: { value: MapMode; label: string }[] = [
  { value: 'municipio', label: 'Meu município' },
  { value: 'territorio', label: 'Território' },
]

// SVG do Figma — gradiente nos 4 cantos formado por retângulos espelhados.
const GLASS_BG_SVG =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 278 43' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><g transform='matrix(28.4 0.2 -0.056201 7.9806 2.5 20)' opacity='0.4'><rect height='51.375' width='97.896' fill='url(%23grad)' id='quad' shape-rendering='crispEdges'/><use href='%23quad' transform='scale(1 -1)'/><use href='%23quad' transform='scale(-1 1)'/><use href='%23quad' transform='scale(-1 -1)'/></g><defs><linearGradient id='grad' gradientUnits='userSpaceOnUse' x2='5' y2='5'><stop stop-color='rgba(117,125,184,1)' offset='0'/><stop stop-color='rgba(92,99,149,1)' offset='0.33894'/><stop stop-color='rgba(67,73,115,1)' offset='0.67788'/><stop stop-color='rgba(48,54,89,1)' offset='0.83894'/><stop stop-color='rgba(30,35,64,1)' offset='1'/></linearGradient></defs></svg>\")"

export default function MapModeToggle({ value, onChange, className = '' }: MapModeToggleProps) {
  return (
    <div
      className={`relative inline-flex items-center rounded-full h-[43px] w-[278px] p-[4px] ${className}`}
      style={{ backgroundImage: GLASS_BG_SVG, backgroundSize: '100% 100%' }}
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
            className={`flex-1 h-[35px] rounded-full text-[16px] font-medium leading-normal transition-colors ${
              isActive
                ? 'bg-[#D4FE07] text-black'
                : 'text-white hover:text-[#D4FE07]'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
