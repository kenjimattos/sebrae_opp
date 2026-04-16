// Figma: CaseStudies/Card (288:8)

import TitleSubtitle from '@/components/TitleSubtitle'
import PillButton from '@/components/ui/buttons/PillButton'
import { ctaLabels } from '@/data/labels'
import type { CasoSucesso } from '@/data/casos-sucesso'

interface CaseStudiesCardProps {
  caso: CasoSucesso
  className?: string
}

export default function CaseStudiesCard({ caso, className = '' }: CaseStudiesCardProps) {
  return (
    <div
      className={`bg-surface flex-col-start overflow-clip radius-sm w-[350px] shrink-0 ${className}`}
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
      <div className="flex flex-col gap-md items-end px-md py-md w-full flex-1">
        {/* Content */}
        <div className="flex flex-col gap-md items-start overflow-clip w-full flex-1">
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
        <PillButton size="sm" label={ctaLabels.verEstudoDeCaso} href="#" className="w-[198px]" />
      </div>
    </div>
  )
}
