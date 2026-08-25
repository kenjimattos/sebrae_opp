// Toggle segmentado que troca o painel no lugar (role="tablist"). Consumido
// pela SectionJornada, para alternar os modos de cada pilar, e pelo
// ModeResources, para alternar as esferas de emenda.
// Efeito glass com bevel visível: backdrop-blur + gradiente sutil + borda em
// gradiente (mais clara no topo, escura embaixo) via background-clip + sombra
// inset white no topo pra reforçar o highlight.
//
// A "pill" de seleção é um único elemento absoluto que desliza entre os botões.
// Medimos o offset/largura do botão ativo via refs pra animar a posição mesmo
// com labels de larguras diferentes.

import { useLayoutEffect, useRef, useState } from 'react'

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
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)
  // Anima o deslize do pill ao trocar de modo; desliga quando o conjunto de
  // opções muda (troca de jornada) pra o pill apenas reposicionar sem deslizar.
  const [animate, setAnimate] = useState(false)
  const prevOptionsRef = useRef(options)

  const activeIndex = options.findIndex((opt) => opt.value === value)

  // Mede o botão ativo e reposiciona o pill. useLayoutEffect evita flash de
  // posição antiga antes do paint. Reage a value/options.
  useLayoutEffect(() => {
    const el = buttonRefs.current[activeIndex]
    if (!el) return
    setAnimate(prevOptionsRef.current === options)
    prevOptionsRef.current = options
    setPill({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeIndex, options])

  return (
    <div
      className={`glass glass-bevel w-fit relative inline-flex items-center rounded-full ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {pill && (
        <span
          aria-hidden
          className={`absolute top-1/2 -translate-y-1/2 h-[80%] rounded-full bg-accent ${
            animate ? 'transition-[left,width] duration-300 ease-out' : ''
          }`}
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {options.map((opt, i) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonRefs.current[i] = el
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={`relative z-10 rounded-full typo-button transition-colors whitespace-nowrap h-[2.5rem] px-sm m-2xs ${
              isActive ? 'text-on-accent' : 'text-primary hover:text-accent'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
