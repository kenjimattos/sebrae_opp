// Figma: Formulador/Card (296:8)

import PillButton from '@/components/ui/buttons/PillButton'
import TitleSubtitle from '../ui/TitleSubtitle'
import SectionCard from '../ui/SectionCard'

interface FormuladorCardProps {
  titulo: string
  descricao: string
  buttonLabel: string
  buttonHref: string
  className?: string
}

export default function FormuladorCard({
  titulo,
  descricao,
  buttonLabel,
  buttonHref,
  className = '',
}: FormuladorCardProps) {
  return (
    <SectionCard className="flex flex-col items-end gap-lg">
      
      <TitleSubtitle
        title={titulo}
        subtitle={descricao}
      />

      <PillButton label={buttonLabel} href={buttonHref} />
    </SectionCard>
  )
}
