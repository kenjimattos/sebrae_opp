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
  { value: 'territorio', label: 'Território' },
]

export default function MapModeToggle({ value, onChange, className = '' }: MapModeToggleProps) {
  return (
    <div
      className={`relative inline-flex items-center rounded-full h-[43px] w-[278px] p-[4px] backdrop-blur-md ${className}`}
      role="tablist"
      aria-label="Modo de visualização do mapa"
      style={{
        // Gradiente sutil de centro→quinas (claro→escuro) como o SVG do Figma.
        background:
          'radial-gradient(ellipse 80% 120% at 50% 50%, rgba(117,125,184,0.35) 0%, rgba(67,73,115,0.35) 50%, rgba(30,35,64,0.45) 100%)',
        // Borda em gradient (highlight no topo, sombra embaixo) via dupla camada.
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        border: '1px solid transparent',
        // Bevel: highlight branco translúcido no topo + sombra escura embaixo.
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.35), inset 1px 0 0 rgba(255,255,255,0.08), inset -1px 0 0 rgba(255,255,255,0.08)',
      }}
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
            className={`relative flex-1 h-[35px] rounded-full text-[16px] font-medium leading-normal transition-colors ${
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
