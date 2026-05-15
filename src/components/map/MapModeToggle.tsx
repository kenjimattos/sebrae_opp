// Toggle segmentado "Meu município / Território" usado sobre o mapa na /new.
// Visual: pílula glass (translúcida + backdrop-blur + leve gradiente nos cantos)
// com a opção ativa preenchida pelo accent.

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
      className={`relative inline-flex rounded-full p-[4px] border border-white/10 bg-white/5 backdrop-blur-md ${className}`}
      style={{
        backgroundImage:
          'radial-gradient(circle at top left, rgba(117,125,184,0.4), transparent 60%), radial-gradient(circle at bottom right, rgba(30,35,64,0.4), transparent 60%)',
      }}
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
            className={`typo-body px-md py-2xs rounded-full transition-colors ${
              isActive
                ? 'bg-[var(--semantic-accent)] text-black'
                : 'text-white hover:text-[var(--semantic-accent)]'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
