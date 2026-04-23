// Figma: CaseStudies/Card (288:8)

import TitleSubtitle from '@/components/ui/TitleSubtitle'
import PillButton from '@/components/ui/buttons/PillButton'
import Card from '@/components/ui/Card'
import type { CaseStudy } from '@/data/home/case-studies'

interface CaseStudiesCardProps {
  caseStudy: CaseStudy
  className?: string
}

export default function CaseStudiesCard({ caseStudy, className = '' }: CaseStudiesCardProps) {
  return (
    <Card
      padding="none"
      className={`flex-col-start overflow-clip w-[320px] shrink-0 ${className}`}
    >
      {/* Image */}
      <div className="h-[180px] w-full relative">
        <img
          alt={caseStudy.title}
          className="absolute inset-0 object-cover size-full"
          src={caseStudy.image}
        />
      </div>

      {/* Content + CTA */}
      <div className="flex flex-col gap-md items-end px-md py-md w-full flex-1">
        {/* Content */}
        <div className="flex flex-col gap-md items-start overflow-clip w-full flex-1">
          <span className="typo-body-sm text-inactive whitespace-nowrap">
            {caseStudy.city}
          </span>
          <TitleSubtitle
            size="sm"
            title={caseStudy.title}
            subtitle={caseStudy.description}
          />
        </div>

        {/* CTA link */}
        <PillButton
          variant="ghost"
          size="sm"
          label="Ver estudo de caso"
          href={caseStudy.url}
        />
      </div>
    </Card>
  )
}
