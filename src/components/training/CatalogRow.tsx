// Tailwind pure — no Figma equivalent
// Fileira do catálogo /trilhas: cabeçalho da trilha + trilho horizontal que
// sangra até a borda da tela (ver .catalog-rail em index.css).
//
// Difere do Carousel genérico em dois pontos deliberados: as setas ficam
// SOBREPOSTAS às bordas do trilho (aparecem na intenção — hover ou foco no
// teclado) em vez de empilhadas abaixo, e desabilitam nas pontas. O trilho
// segue rolável por teclado e trackpad mesmo com as setas escondidas.

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from '@/components/icons'
import IconButton from '@/components/ui/buttons/IconButton'

interface CatalogRowProps {
  children: React.ReactNode
  /** Rótulo acessível do trilho (título da trilha). */
  label: string
  className?: string
}

// Rola aproximadamente uma "página" de pôsteres, deixando um de sobreposição
// para o olho não perder o contexto.
const OVERLAP = 260

export default function CatalogRow({ children, label, className = '' }: CatalogRowProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const syncEdges = useCallback(() => {
    const el = railRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 1)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    syncEdges()
    const el = railRef.current
    if (!el) return
    window.addEventListener('resize', syncEdges)
    return () => window.removeEventListener('resize', syncEdges)
  }, [syncEdges])

  const scroll = (direction: 'left' | 'right') => {
    const el = railRef.current
    if (!el) return
    const amount = Math.max(240, el.clientWidth - OVERLAP)
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className={`group/row relative ${className}`}>
      <div
        ref={railRef}
        onScroll={syncEdges}
        role="group"
        aria-label={label}
        tabIndex={0}
        className="catalog-rail scrollbar-hide focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        {children}
      </div>

      {/* Setas sobrepostas: invisíveis até o hover na fileira ou foco no teclado. */}
      <div className="pointer-events-none absolute inset-y-0 left-xs right-xs flex-between opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 focus-within:opacity-100">
        <span className={`pointer-events-auto ${atStart ? 'invisible' : ''}`}>
          <IconButton
            icon={ArrowLeft}
            onClick={() => scroll('left')}
            aria-label={`Ver cursos anteriores de ${label}`}
            variant="tertiary"
            size="lg"
          />
        </span>
        <span className={`pointer-events-auto ${atEnd ? 'invisible' : ''}`}>
          <IconButton
            icon={ArrowRight}
            onClick={() => scroll('right')}
            aria-label={`Ver mais cursos de ${label}`}
            variant="tertiary"
            size="lg"
          />
        </span>
      </div>
    </div>
  )
}
