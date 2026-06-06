// Figma: CaseStudies/Card (288:8)

import TitleSubtitle from '@/components/ui/TitleSubtitle'
import Button from '@/components/ui/buttons/Button'
import type { CaseStudy } from '@/data/home/case-studies'

interface CaseStudiesCardProps {
  caseStudy: CaseStudy
  className?: string
}

export default function CaseStudiesCard({ caseStudy, className = '' }: CaseStudiesCardProps) {
  return (
    <div
      className={`flex-col-start overflow-clip border w-[32%] shrink-0 ${className}`}
    >
      {/* Image */}
      <div className="h-[14dvh] w-full relative">
        <img
          alt={caseStudy.title}
          className="absolute inset-0 object-cover size-full"
          src={caseStudy.image}
        />
      </div>

      {/* Content + CTA */}
      <div className="flex flex-col gap-lg items-center px-md py-md w-full flex-1">
        {/* Content */}
        <div className="flex flex-col gap-md items-start overflow-clip w-full flex-1">
          <span className="typo-body-sm text-inactive whitespace-nowrap">
            {caseStudy.city}
          </span>
          <TitleSubtitle
            size="sm"
            title={caseStudy.title}
            subtitle={caseStudy.description}
            className="gap-md"
          />
        </div>

        {/* CTA link */}
        <Button
          variant="secondary"
          size="sm"
          label="Ver estudo de caso"
          onClick={() => window.location.href = caseStudy.url}
        />
      </div>
    </div>
  )
}
