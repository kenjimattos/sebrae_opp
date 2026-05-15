// Toggle segmentado "Meu município / Território" usado sobre o mapa na /new.
// Background é o SVG corner-gradient do Figma renderizado inline (4 retângulos
// espelhados com gradiente linear → bevel/highlight nas quinas). Inline em vez
// de CSS background data URI por confiabilidade de renderização do gradient.

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

function GlassBevelBackground() {
  return (
    <svg
      viewBox="0 0 278 43"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full rounded-full pointer-events-none"
      aria-hidden
    >
      <defs>
        <linearGradient id="bevel-grad" gradientUnits="userSpaceOnUse" x2="5" y2="5">
          <stop stopColor="rgba(117,125,184,1)" offset="0" />
          <stop stopColor="rgba(92,99,149,1)" offset="0.33894" />
          <stop stopColor="rgba(67,73,115,1)" offset="0.67788" />
          <stop stopColor="rgba(48,54,89,1)" offset="0.83894" />
          <stop stopColor="rgba(30,35,64,1)" offset="1" />
        </linearGradient>
      </defs>
      <g
        transform="matrix(28.4 0.2 -0.056201 7.9806 2.5 20)"
        opacity="0.4"
      >
        <rect
          id="bevel-quad"
          width="97.896"
          height="51.375"
          fill="url(#bevel-grad)"
          shapeRendering="crispEdges"
        />
        <use href="#bevel-quad" transform="scale(1 -1)" />
        <use href="#bevel-quad" transform="scale(-1 1)" />
        <use href="#bevel-quad" transform="scale(-1 -1)" />
      </g>
    </svg>
  )
}

export default function MapModeToggle({ value, onChange, className = '' }: MapModeToggleProps) {
  return (
    <div
      className={`relative inline-flex items-center rounded-full h-[43px] w-[278px] p-[4px] overflow-hidden ${className}`}
      role="tablist"
      aria-label="Modo de visualização do mapa"
    >
      <GlassBevelBackground />
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
