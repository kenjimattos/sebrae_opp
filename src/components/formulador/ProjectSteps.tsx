// Figma: Formulador/ProjectSteps (603:2135)
// Sidebar esquerda: header "Etapas do projeto" + 10 StepIndicators.
// Status de cada etapa é derivado:
//   - etapa atual (currentSlug) → 'current'
//   - etapa em completedSlugs → 'checked'
//   - etapa em visitedSlugs (mas incompleta) → 'in-progress'
//   - demais → 'unchecked'

import Card from '@/components/ui/Card'
import StepIndicator from './StepIndicator'
import { etapasFormulador } from '@/data/formulador/etapas'

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
    <Card padding="lg" className={`flex flex-col items-start gap-sm ${className}`}>
      <p className="typo-body-bold">Etapas do projeto</p>
      {etapasFormulador.map((etapa) => {
        const status =
          etapa.slug === currentSlug
            ? 'current'
            : completedSlugs.includes(etapa.slug)
              ? 'checked'
              : visitedSlugs.includes(etapa.slug)
                ? 'in-progress'
                : 'unchecked'
        return (
          <StepIndicator
            key={etapa.slug}
            label={etapa.label}
            status={status}
            onClick={onSelect ? () => onSelect(etapa.slug) : undefined}
          />
        )
      })}
    </Card>
  )
}
