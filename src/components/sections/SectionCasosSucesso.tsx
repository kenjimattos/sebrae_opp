// Figma: Section/CasosSucesso (390:623)

import { useRef } from 'react'
import { ArrowLeft, ArrowRight } from '@/components/icons'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import CaseStudiesCard from '@/components/case-studies/CaseStudiesCard'
import IconButton from '@/components/ui/buttons/IconButton'
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
        <SectionHeader title={sectionContent.casosSucesso.title} description={sectionContent.casosSucesso.description} />
      </div>
      <div className="flex flex-col items-center gap-sm">
        {/* Cards scroll */}
        {/* py-xs + -my-xs: respiro interno para o lift + anel do card-hoverable
            sem alterar o espaçamento externo (overflow-x força overflow-y a clipar) */}
        <div
          ref={scrollRef}
          className="flex gap-sm overflow-x-auto w-full snap-x snap-mandatory scrollbar-hide py-xs -my-[var(--spacing-xs)]"
        >
          {casosSucesso.map((caso) => (
            <CaseStudiesCard key={caso.id} caso={caso} className="snap-start" />
          ))}
        </div>

        {/* Navigation arrows */}
        <div className="flex gap-xl items-center justify-end w-full">
          <IconButton icon={ArrowLeft} onClick={() => scroll('left')} aria-label="Anterior" variant="secondary" size="lg" />
          <IconButton icon={ArrowRight} onClick={() => scroll('right')} aria-label="Próximo" variant="secondary" size="lg" />
        </div>
      </div>
    </SectionContainer>
  )
}
