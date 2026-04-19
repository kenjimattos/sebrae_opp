// Rota /formulador/:stepSlug — despacha para o form da etapa correta.
// Layout interno: ProjectSteps (esquerda) + FormCard (centro).

import { useParams, useNavigate, Navigate } from 'react-router-dom'
import ProjectSteps from '@/components/formulador/ProjectSteps'
import FormCard from '@/components/formulador/FormCard'
import { etapasFormulador, findEtapaIndex, findEtapaBySlug } from '@/data/formulador-etapas'
import { useFormulador } from '@/hooks/useFormulador'
import { StepForm } from '@/components/formulador/steps'
import { isEtapaCompleta } from '@/utils/formuladorCompleteness'

export default function FormuladorStep() {
  const { stepSlug = '' } = useParams()
  const navigate = useNavigate()
  const { state, markVisited } = useFormulador()

  const etapa = findEtapaBySlug(stepSlug)
  const index = findEtapaIndex(stepSlug)

  if (!etapa) {
    return <Navigate to="/formulador/identificacao" replace />
  }

  const isLast = index === etapasFormulador.length - 1

  function goToSlug(slug: string) {
    navigate(`/formulador/${slug}`)
  }

  function onPrev() {
    const prevIdx = index - 1
    if (prevIdx >= 0) goToSlug(etapasFormulador[prevIdx].slug)
  }

  function onNext() {
    markVisited(stepSlug)
    if (isLast) {
      navigate('/formulador/conclusao')
    } else {
      goToSlug(etapasFormulador[index + 1].slug)
    }
  }

  return (
    <div className="flex items-stretch gap-sm w-full">
      <ProjectSteps
        currentSlug={stepSlug}
        visitedSlugs={state.etapasVisitadas}
        completedSlugs={etapasFormulador.filter((e) => isEtapaCompleta(e.slug, state)).map((e) => e.slug)}
        onSelect={goToSlug}
      />

      <FormCard
        titulo={etapa.titulo}
        subtitle={etapa.subtitle}
        currentIndex={index}
        onPrev={onPrev}
        onNext={onNext}
      >
        <StepForm slug={stepSlug} />
      </FormCard>
    </div>
  )
}
