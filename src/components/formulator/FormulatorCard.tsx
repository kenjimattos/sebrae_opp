// Figma: Formulador/Card (296:8)

import PillButton from '@/components/ui/buttons/PillButton'
import TitleSubtitle from '../ui/TitleSubtitle'
import Card from '../ui/Card'

interface FormulatorCardProps {
  title: string
  description: string
  buttonLabel: string
  buttonHref: string
}

export default function FormulatorCard({
  title,
  description,
  buttonLabel,
  buttonHref,
}: FormulatorCardProps) {
  return (
    <Card as="section" padding="lg" className="flex flex-col items-end gap-2xl">
        <TitleSubtitle
          title={title}
          subtitle={description}
          className="flex-1"
        />

      <PillButton label={buttonLabel} href={buttonHref} />
    </Card>
  )
}
