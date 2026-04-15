// Figma: Section/CasosSucesso (390:623)

import { useRef } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/SectionHeader'
import CaseStudiesCard from '@/components/case-studies/CaseStudiesCard'
import ScrollArrowButton from '@/components/ui/ScrollArrowButton'
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
      <div className="flex-between w-full">
        <SectionHeader title={sectionContent.casosSucesso.title} />
      </div>
      <div className="flex flex-col items-center gap-sm">
        {/* Cards scroll */}
        <div
          ref={scrollRef}
          className="flex gap-sm overflow-x-auto w-full snap-x snap-mandatory scrollbar-hide"
        >
          {casosSucesso.map((caso) => (
            <CaseStudiesCard key={caso.id} caso={caso} className="snap-start" />
          ))}
        </div>

        {/* Navigation arrows */}
        <div className="flex gap-xl items-center justify-end w-full">
          <ScrollArrowButton icon={ArrowLeft} onClick={() => scroll('left')} ariaLabel="Anterior" />
          <ScrollArrowButton icon={ArrowRight} onClick={() => scroll('right')} ariaLabel="Próximo" />
        </div>
      </div>
    </SectionContainer>
  )
}
