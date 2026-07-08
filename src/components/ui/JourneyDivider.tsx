// Marco de transição entre a SectionAgendas (diagnóstico: indicadores + mapa) e
// a SectionJornada (os 4 pilares). Além de separar visualmente as duas seções,
// avisa que há mais conteúdo abaixo e leva até lá: clicar rola suave até a Jornada.
//
// Hairline em gradiente (transparente nas pontas → acento no centro) puxa o olhar
// pra pílula central; o chevron "escorre" (journey-cue) como dica de rolagem.

import { ChevronDown, iconSizes } from '@/components/icons'

interface JourneyDividerProps {
  /** id da seção-alvo para rolar ao clicar. Default: 'ambiente' (a Jornada). */
  targetId?: string
  className?: string
}

export default function JourneyDivider({
  targetId = 'ambiente',
  className = '',
}: JourneyDividerProps) {
  function handleClick() {
    const el = document.getElementById(targetId)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div
      className={`flex items-center gap-md w-full select-none px-gutter py-xs ${className}`}
      role="separator"
      aria-orientation="horizontal"
    >
      <span
        aria-hidden
        className="h-px flex-1 bg-gradient-to-r from-transparent to-[color-mix(in_srgb,var(--semantic-accent)_45%,transparent)]"
      />

      <button
        type="button"
        onClick={handleClick}
        aria-label="Continue a jornada — role até os pilares abaixo"
        className="group glass rounded-full flex items-center gap-xs pl-md pr-sm py-2xs transition-transform duration-200 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--semantic-accent)]"
      >
        <span className="typo-body-sm-bold uppercase tracking-[0.08em]">
          Continue a jornada
        </span>
        <ChevronDown
          size={iconSizes.sm}
          className="text-accent journey-cue-chevron shrink-0"
          aria-hidden
        />
      </button>

      <span
        aria-hidden
        className="h-px flex-1 bg-gradient-to-l from-transparent to-[color-mix(in_srgb,var(--semantic-accent)_45%,transparent)]"
      />
    </div>
  )
}
