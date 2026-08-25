// Figma: Formulador/FormCard (696:2665)
// Card central do Formulador: título + subtítulo + slot do form + footer paginação.
// Footer exibe Anterior (quando não é a primeira etapa), "X/10 etapas" ao centro, e Próxima/Finalizar à direita.

import Button from '@/components/ui/buttons/Button'
import { formulatorSteps } from '@/data/formulator/steps'
import { ArrowLeft, ArrowRight } from '@/components/icons'

interface FormCardProps {
  titulo: string
  subtitle: string
  currentIndex: number     // 0..9
  onPrev?: () => void
  onNext: () => void       // também usado para "Finalizar" na última etapa
  children: React.ReactNode
  className?: string
}

export default function Form({
  titulo,
  subtitle,
  currentIndex,
  onPrev,
  onNext,
  children,
  className = '',
}: FormCardProps) {
  const total = formulatorSteps.length
  const isFirst = currentIndex === 0
  const isLast = currentIndex === total - 1

  return (
    <div
      className={`glass p-md rounded flex flex-col gap-md flex-1 ${className}`}
    >
      <div className="flex flex-col items-start gap-xs">
        <h2 className="typo-body-lg-bold">{titulo}</h2>
        <p className="typo-body">{subtitle}</p>
      </div>

      {children}

      <div className="flex items-center justify-between">
        <div className="min-w-[120px]">
          {!isFirst && onPrev && (
            <Button
              icon={ArrowLeft}
              label="Anterior"
              variant="secondary"
              iconPosition="left"
              onClick={onPrev}
            />
          )}
        </div>
        <p className="typo-body">
          {currentIndex + 1}/{total} etapas
        </p>
        <div className="min-w-[120px] flex justify-end">
          <Button
            icon={ArrowRight}
            label={isLast ? 'Finalizar' : 'Próxima'}
            variant={isLast ? 'primary' : 'secondary'}
            iconPosition="right"
            onClick={onNext}
          />
        </div>
      </div>
    </div>
  )
}
