// Overlay decorativo: escurece o conteúdo do pai no hover e revela uma pill
// com um label curto (hint de interação). A pill é um <span> — o clique
// deve ficar no elemento pai (<a>, <button> ou <div onClick>).
//
// Uso: o elemento pai precisa ter `relative group` (ou equivalente) para
// que os utilitários `group-hover:*` funcionem. Exemplos:
//   - <a ... className="relative group"> <HoverOverlay label="Abrir" /> </a>
//   - <div className="relative group" onClick={...}> <HoverOverlay ... /> </div>
//
// `radius` deve espelhar o radius do container pai para que o overlay não
// ultrapasse os cantos arredondados da imagem/mapa abaixo.

interface HoverOverlayProps {
  label: string
  radius?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const radiusClasses: Record<NonNullable<HoverOverlayProps['radius']>, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
}

export default function HoverOverlay({ label, radius = 'md', className = '' }: HoverOverlayProps) {
  return (
    <div
      aria-hidden
      className={`absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center ${radiusClasses[radius]} ${className}`}
    >
      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-surface typo-body-bold px-md py-sm rounded-full shadow-lg">
        {label}
      </span>
    </div>
  )
}
