// Figma: Section/Capacitacao (390:611)

import Carousel from '@/components/ui/Carousel'
import TrainingCard from '@/components/training/TrainingCard'
import { trails } from '@/data/home/training'

export default function ModeTraining() {
  return (
    <>
      <Carousel>
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
