// Figma: Section/Capacitacao (390:611)

import Carousel from '@/components/ui/Carousel'
import TrainingCard from '@/components/training/TrainingCard'
import { trails } from '@/data/home/training'

// TrainingCard w-480 + gap-sm (12px)
const SCROLL_AMOUNT = 480 + 12

export default function SectionTraining() {
  return (
    <>
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
    </>
  )
}
