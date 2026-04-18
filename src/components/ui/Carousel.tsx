// Carrossel horizontal com snap-scroll + setas de navegação.
// Usado em SectionCapacitacao e SectionCasosSucesso.

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
    <div className={`flex flex-col items-center gap-md ${className}`}>
      {/* py-xs + -my-xs: respiro interno para o lift + anel do card-hoverable
          sem alterar o espaçamento externo (overflow-x força overflow-y a clipar) */}
      <div
        ref={scrollRef}
        className="flex gap-sm overflow-x-auto w-full snap-x snap-mandatory scrollbar-hide py-xs px-xs -my-[var(--spacing-xs)]"
      >
        {children}
      </div>

      <div className="flex gap-xl items-center justify-end w-full">
        <IconButton
          icon={ArrowLeft}
          onClick={() => scroll('left')}
          aria-label="Anterior"
          variant="secondary"
          size="lg"
        />
        <IconButton
          icon={ArrowRight}
          onClick={() => scroll('right')}
          aria-label="Próximo"
          variant="secondary"
          size="lg"
        />
      </div>
    </div>
  )
}
