// Carrossel horizontal com snap-scroll e o par de setas empilhado **abaixo**
// do trilho, alinhado à direita. Consumido pelos dois modos do pilar "Cursos e
// boas práticas" na Home: ModeTraining e ModeCaseStudies.
//
// O passo de rolagem é fixo e vem do consumidor (`scrollAmount` = largura do
// card + gap), porque aqui o card tem largura conhecida.
//
// Não confundir com o CatalogRow da /trilhas, que é outro componente: lá as
// setas ficam sobrepostas às bordas do trilho, aparecem só na intenção,
// desabilitam nas pontas e o passo é calculado a partir da largura visível.
// Os dois compartilham só a ideia de `scrollBy({ behavior: 'smooth' })`; a
// diferença de chrome é deliberada e está descrita no CatalogRow.

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
