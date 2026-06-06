
import Carousel from '@/components/ui/Carousel'
import CaseStudiesCard from '@/components/case-studies/CaseStudiesCard'
import { caseStudies } from '@/data/home/case-studies'
import { sectionContent } from '@/data/home/sections'
import TitleSubtitle from '@/components/ui/TitleSubtitle'

// CaseStudiesCard w-350 + gap-sm (12px)
const SCROLL_AMOUNT = 350 + 12

export default function ModeCaseStudies() {
  return (
    <>
      <section className="flex flex-col gap-lg glass rounded-sm p-lg">

        <TitleSubtitle
          title={sectionContent.caseStudies.title}
          subtitle={sectionContent.caseStudies.description}
        />

        <Carousel scrollAmount={SCROLL_AMOUNT}>
          {caseStudies.map((caseStudy) => (
            <CaseStudiesCard key={caseStudy.id} caseStudy={caseStudy} className="snap-start" />
          ))}
        </Carousel>
      </section>
    </>
  )
}
