// Figma: Section/CasosSucesso (390:623)

import { useRef } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/SectionHeader'
import CaseStudiesCard from '@/components/case-studies/CaseStudiesCard'
import { sectionContent } from '@/data/sections'
import { casosSucesso } from '@/data/casos-sucesso'

export default function SectionCasosSucesso() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 375 + 24 // card width + gap
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  return (
    <SectionContainer>
      {/* Header row */}
      <div className="flex items-center justify-between w-full">
        <SectionHeader title={sectionContent.casosSucesso.title} />
      </div>

      {/* Cards scroll */}
      <div
        ref={scrollRef}
        className="flex gap-[var(--spacing-md)] overflow-x-auto w-full pb-[var(--spacing-xs)] snap-x snap-mandatory scrollbar-hide"
      >
        {casosSucesso.map((caso) => (
          <CaseStudiesCard key={caso.id} caso={caso} className="snap-start" />
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="flex gap-[var(--spacing-xl)] items-center justify-end w-full">
        <button
          type="button"
          onClick={() => scroll('left')}
          className="flex items-center justify-center w-[48px] h-[48px] bg-[var(--semantic-surface-primary)] rounded-full transition-opacity hover:opacity-70"
          aria-label="Anterior"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          type="button"
          onClick={() => scroll('right')}
          className="flex items-center justify-center w-[48px] h-[48px] bg-[var(--semantic-surface-primary)] rounded-full transition-opacity hover:opacity-70"
          aria-label="Próximo"
        >
          <ArrowRight size={24} />
        </button>
      </div>
    </SectionContainer>
  )
}
