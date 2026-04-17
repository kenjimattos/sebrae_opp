// Figma: Formulador/FormCard (696:2665)
// Card central do Formulador: título + subtítulo + slot do form + footer paginação.
// Footer exibe Anterior (quando não é a primeira etapa), "X/10 etapas" ao centro, e Próxima/Finalizar à direita.

import Card from '@/components/ui/Card'
import PillButton from '@/components/ui/buttons/PillButton'
import { etapasFormulador } from '@/data/formulador-etapas'

interface FormCardProps {
  titulo: string
  subtitle: string
  currentIndex: number     // 0..9
  onPrev?: () => void
  onNext: () => void       // também usado para "Finalizar" na última etapa
  children: React.ReactNode
  className?: string
}

export default function FormCard({
  titulo,
  subtitle,
  currentIndex,
  onPrev,
  onNext,
  children,
  className = '',
}: FormCardProps) {
  const total = etapasFormulador.length
  const isFirst = currentIndex === 0
  const isLast = currentIndex === total - 1

  return (
    <Card
      padding="lg"
      radius="sm"
      className={`flex flex-col items-stretch gap-lg flex-1 ${className}`}
    >
      <div className="flex flex-col items-start gap-xs">
        <h2 className="typo-body-lg-bold">{titulo}</h2>
        <p className="typo-body">{subtitle}</p>
      </div>

      <div className="flex-1">{children}</div>

      <div className="flex items-center justify-between">
        <div className="min-w-[120px]">
          {!isFirst && onPrev && (
            <PillButton
              label="Anterior"
              variant="secondary"
              size="sm"
              iconPosition="left"
              onClick={onPrev}
            />
          )}
        </div>
        <p className="typo-body">
          {currentIndex + 1}/{total} etapas
        </p>
        <div className="min-w-[120px] flex justify-end">
          <PillButton
            label={isLast ? 'Finalizar' : 'Próxima'}
            variant={isLast ? 'primary' : 'secondary'}
            size="sm"
            iconPosition="right"
            onClick={onNext}
          />
        </div>
      </div>
    </Card>
  )
}
