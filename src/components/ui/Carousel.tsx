// Carrossel horizontal com snap-scroll e o par de setas empilhado **abaixo**
// do trilho, alinhado à direita. Consumido pelos dois modos do pilar "Cursos e
// boas práticas" na Home: ModeTraining e ModeCaseStudies.
//
// O passo de rolagem é um card, medido em tempo de execução (ver `scroll`).
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
  className?: string
}

export default function Carousel({ children, className = '' }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Um card por clique, medido na hora. O passo já foi uma constante por
  // consumidor (`scrollAmount`), e as duas envelheceram em silêncio: diziam
  // 480px e 350px de card enquanto os cards viraram w-[40%] e w-[32%] — na
  // coluna do painel, 325px. O passo andava 1,46 card e o snap-mandatory
  // corrigia para o mais próximo, então o avanço oscilava entre um e dois
  // cards conforme a posição. Largura declarada não sobrevive a card fluido;
  // medida, sim.
  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const first = el.firstElementChild
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    const step = first ? first.getBoundingClientRect().width + gap : el.clientWidth
    el.scrollBy({
      left: direction === 'left' ? -step : step,
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
