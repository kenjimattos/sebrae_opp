// Figma: Formulador/Card (296:8)

import PillButton from '@/components/ui/buttons/PillButton'
import TitleSubtitle from '../ui/TitleSubtitle'
import Card from '../ui/Card'

interface FormuladorCardProps {
  titulo: string
  descricao: string
  buttonLabel: string
  buttonHref: string
}

export default function FormuladorCard({
  titulo,
  descricao,
  buttonLabel,
  buttonHref,
}: FormuladorCardProps) {
  return (
    <Card as="section" padding="lg" className="flex flex-col items-end gap-2xl">
        <TitleSubtitle
          title={titulo}
          subtitle={descricao}
          className="flex-1"
        />

      <PillButton label={buttonLabel} href={buttonHref} />
    </Card>
  )
}
