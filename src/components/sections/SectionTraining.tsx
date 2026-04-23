// Figma: Section/Capacitacao (390:611)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import Carousel from '@/components/ui/Carousel'
import TrainingCard from '@/components/training/TrainingCard'
import { sectionContent } from '@/data/home/sections'
import { trails } from '@/data/home/training'

// TrainingCard w-480 + gap-sm (12px)
const SCROLL_AMOUNT = 480 + 12

export default function SectionTraining() {
  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.training.title} description={sectionContent.training.description} />

      <Carousel scrollAmount={SCROLL_AMOUNT}>
        {trails.map((trail) => (
          <TrainingCard
            key={trail.slug}
            slug={trail.slug}
            title={trail.title}
            description={trail.description}
            courses={trail.courses}
            className="snap-start"
          />
        ))}
      </Carousel>
    </SectionContainer>
  )
}
