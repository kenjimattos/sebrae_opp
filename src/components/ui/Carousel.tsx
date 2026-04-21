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
    <div className={`relative ${className}`}>
      {/* py-md + -my-md: respiro interno (24px) para o lift + anel + sombra
          inferior do card-hoverable (box-shadow estende ~23px abaixo), sem
          alterar o espaçamento externo (overflow-x força overflow-y a clipar).
          scroll-padding-inline evita que o snap cole o card na borda, o que
          clipava o anel de 1px do hover à esquerda/direita. */}
      <div
        ref={scrollRef}
        className="flex gap-sm overflow-x-auto w-full snap-x snap-mandatory scrollbar-hide py-md px-xs -my-[var(--spacing-md)]"
        style={{ scrollPaddingInline: 'var(--spacing-xs)' }}
      >
        {children}
      </div>

      {/* Setas no gutter lateral da section (fora do content box, dentro do
          padding de --spacing-margin). `-translate-y-1/2` centraliza no eixo Y. */}
      <IconButton
        icon={ArrowLeft}
        onClick={() => scroll('left')}
        aria-label="Anterior"
        variant="secondary"
        size="lg"
        className="absolute top-1/2 -translate-y-1/2 left-[calc(-1*var(--spacing-3xl))] z-10"
      />
      <IconButton
        icon={ArrowRight}
        onClick={() => scroll('right')}
        aria-label="Próximo"
        variant="secondary"
        size="lg"
        className="absolute top-1/2 -translate-y-1/2 right-[calc(-1*var(--spacing-3xl))] z-10"
      />
    </div>
  )
}
