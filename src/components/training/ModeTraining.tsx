// Figma: Section/Capacitacao (390:611)

import Carousel from '@/components/ui/Carousel'
import TrainingCard from '@/components/training/TrainingCard'
import { trails, origin } from '@/data/home/training'

export default function ModeTraining() {
  const url = origin

  return (
    <div className='flex flex-col gap-sm'>
      <span className='typo-body-sm-bold'>
        Cursos disponibilizados na plataforma <a className='text-accent' href={url}>{url}</a>
      </span>
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
    </div>
  )
}
