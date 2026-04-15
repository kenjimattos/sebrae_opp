// Figma: CaseStudies/Card (288:8)

import { ArrowRight } from 'lucide-react'
import TitleSubtitle from '@/components/TitleSubtitle'
import type { CasoSucesso } from '@/data/casos-sucesso'

interface CaseStudiesCardProps {
  caso: CasoSucesso
  className?: string
}

export default function CaseStudiesCard({ caso, className = '' }: CaseStudiesCardProps) {
  return (
    <div
      className={`bg-[var(--semantic-surface-primary)] flex flex-col items-start overflow-clip rounded-[var(--radius-sm)] w-[350px] shrink-0 ${className}`}
    >
      {/* Image */}
      <div className="h-[180px] w-full relative">
        <img
          alt={caso.titulo}
          className="absolute inset-0 object-cover size-full"
          src={caso.imagem}
        />
      </div>

      {/* Content + CTA */}
      <div className="flex flex-col gap-[var(--spacing-md)] items-end px-[var(--spacing-md)] py-[var(--spacing-md)] w-full flex-1">
        {/* Content */}
        <div className="flex flex-col gap-[var(--spacing-md)] items-start overflow-clip w-full flex-1">
          <span className="typo-body-sm text-inactive whitespace-nowrap">
            {caso.cidade}
          </span>
          <TitleSubtitle
            size="sm"
            title={caso.titulo}
            content={caso.descricao}
          />
        </div>

        {/* CTA link */}
        <div className="flex gap-[12px] h-[24px] items-center pl-[var(--spacing-sm)] rounded-[var(--radius-full)] w-[198px]">
          <span className="flex-1 typo-button-sm">
            Ver estudo de caso
          </span>
          <span className="flex items-center justify-center w-[24px] h-[24px] bg-[var(--semantic-surface-secondary)] rounded-full shrink-0">
            <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </div>
  )
}
