// Figma: Formulador/ProjectSteps (603:2135)
// Sidebar esquerda: header "Etapas do projeto" + 10 StepIndicators.
// Status de cada etapa é derivado:
//   - etapa atual (currentSlug) → 'current'
//   - etapas em visitedSlugs (exceto a atual) → 'checked'
//   - demais → 'unchecked'

import Card from '@/components/ui/Card'
import StepIndicator from './StepIndicator'
import { etapasFormulador } from '@/data/formulador-etapas'

interface ProjectStepsProps {
  currentSlug: string
  visitedSlugs: string[]
  onSelect?: (slug: string) => void
  className?: string
}

export default function ProjectSteps({
  currentSlug,
  visitedSlugs,
  onSelect,
  className = '',
}: ProjectStepsProps) {
  return (
    <Card padding={{ x: 'md', y: 'lg' }} className={`flex flex-col items-start gap-sm ${className}`}>
      <p className="typo-body-bold">Etapas do projeto</p>
      {etapasFormulador.map((etapa) => {
        const status =
          etapa.slug === currentSlug
            ? 'current'
            : visitedSlugs.includes(etapa.slug)
              ? 'checked'
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
