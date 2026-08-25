// Figma: Formulador/ProjectSteps (603:2135)
// Sidebar esquerda: header "Etapas do projeto" + 10 StepIndicators.
// Status de cada etapa é derivado:
//   - etapa atual (currentSlug) → 'current'
//   - etapa em completedSlugs → 'checked'
//   - etapa em visitedSlugs (mas incompleta) → 'in-progress'
//   - demais → 'unchecked'

import StepIndicator from '@/components/formulator/FormulatorStepIndicator'
import { formulatorSteps } from '@/data/formulator/steps'

interface ProjectStepsProps {
  currentSlug: string
  visitedSlugs: string[]
  completedSlugs: string[]
  onSelect?: (slug: string) => void
  className?: string
}

export default function ProjectSteps({
  currentSlug,
  visitedSlugs,
  completedSlugs,
  onSelect,
  className = '',
}: ProjectStepsProps) {
  return (
    <div className={`glass rounded flex flex-col gap-sm p-md ${className}`}>
      <p className="typo-body-bold">Etapas do projeto</p>
      {formulatorSteps.map((step) => {
        const status =
          step.slug === currentSlug
            ? 'current'
            : completedSlugs.includes(step.slug)
              ? 'checked'
              : visitedSlugs.includes(step.slug)
                ? 'in-progress'
                : 'unchecked'
        return (
          <StepIndicator
            key={step.slug}
            label={step.label}
            status={status}
            onClick={onSelect ? () => onSelect(step.slug) : undefined}
          />
        )
      })}
    </div>
  )
}
