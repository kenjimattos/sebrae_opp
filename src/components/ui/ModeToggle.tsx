// Toggle segmentado "Meu município / Território" usado sobre o mapa na /new.
// Efeito glass com bevel visível: backdrop-blur + gradiente sutil + borda em
// gradiente (mais clara no topo, escura embaixo) via background-clip + sombra
// inset white no topo pra reforçar o highlight.

export interface ModeOption {
  value: string
  label: string
}

interface ModeToggleProps {
  value: string
  onChange: (mode: string) => void
  options?: ModeOption[]
  ariaLabel?: string
  className?: string
}

// Default mantido por compatibilidade; consumidores devem passar `options`.
const DEFAULT_OPTIONS: ModeOption[] = [
  { value: '1', label: 'Eixos prioritários' },
  { value: '2', label: 'Panorâma Sócioeconômico' },
  { value: '3', label: 'Riscos estratégicos' },
]

export default function ModeToggle({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  ariaLabel = 'Modo de visualização',
  className = '',
}: ModeToggleProps) {
  return (
    <div
      className={`glass glass-bevel w-fit relative inline-flex items-center rounded-full ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={`rounded-full typo-button transition-colors whitespace-nowrap px-md py-sm m-2xs ${
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
