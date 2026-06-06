// Carrossel horizontal com snap-scroll + setas laterais sobrepostas.
// Usado em SectionCapacitacao e SectionCasosSucesso.
//
// Os botões ficam absolutamente posicionados nos gutters laterais da section
// (dentro da faixa de 180px do --spacing-margin da SectionContainer), usando
// `left/right: calc(-1 * var(--spacing-3xl))` (-96px) — deslocados para fora
// do content box sem alargar o layout.

import { useRef } from 'react'
import { ArrowLeft, ArrowRight } from '@/components/icons'
import IconButton from '@/components/ui/buttons/IconButton'

interface CarouselProps {
  children: React.ReactNode
  scrollAmount: number
  className?: string
}

export default function Carousel({ children, scrollAmount, className = '' }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className={`flex flex-col gap-xl h-full ${className}`}>

      <div
        ref={scrollRef}
        className="flex gap-sm overflow-x-auto w-full snap-x snap-mandatory scrollbar-hide"
        style={{ scrollPaddingInline: 'var(--spacing-xs)' }}
      >
        {children}
      </div>
      <div className="flex justify-end gap-lg w-full">
        <IconButton
          icon={ArrowLeft}
          onClick={() => scroll('left')}
          aria-label="Anterior"
          variant="tertiary"
        />
        <IconButton
          icon={ArrowRight}
          onClick={() => scroll('right')}
          aria-label="Próximo"
          variant="tertiary"
        />
      </div>
    </div>
  )
}
