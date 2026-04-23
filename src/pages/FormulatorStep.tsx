// Rota /formulador/:stepSlug — despacha para o form da etapa correta.
// Layout interno: ProjectSteps (esquerda) + FormCard (centro).

import { useEffect, useRef } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import ProjectSteps from '@/components/formulator/ProjectSteps'
import FormCard from '@/components/formulator/FormCard'
import { formulatorSteps, findStepIndex, findStepBySlug } from '@/data/formulator/steps'
import { useFormulator } from '@/hooks/useFormulator'
import { StepForm } from '@/components/formulator/steps'
import { isStepComplete } from '@/utils/formulatorCompleteness'
import { trackEvent } from '@/utils/analytics'

export default function FormulatorStep() {
  const { stepSlug = '' } = useParams()
  const navigate = useNavigate()
  const { state, markVisited } = useFormulator()
  const stepStartRef = useRef<number>(0)

  const step = findStepBySlug(stepSlug)
  const index = findStepIndex(stepSlug)

  // Dispara `formulador_step_visitado` a cada step carregado e reseta o
  // cronômetro para medir tempo gasto até o próximo avanço.
  useEffect(() => {
    if (!step) return
    stepStartRef.current = Date.now()
    trackEvent('formulador_step_visitado', {
      step: stepSlug,
      numero: index + 1,
    })
  }, [stepSlug, step, index])

  if (!step) {
    return <Navigate to="/formulador/identificacao" replace />
  }

  const isLast = index === formulatorSteps.length - 1

  function goToSlug(slug: string) {
    navigate(`/formulador/${slug}`)
  }

  function onPrev() {
    const prevIdx = index - 1
    if (prevIdx >= 0) goToSlug(formulatorSteps[prevIdx].slug)
  }

  function onNext() {
    markVisited(stepSlug)
    trackEvent('formulador_step_concluido', {
      step: stepSlug,
      numero: index + 1,
      tempo_ms: Date.now() - stepStartRef.current,
    })
    if (isLast) {
      navigate('/formulador/conclusao')
    } else {
      goToSlug(formulatorSteps[index + 1].slug)
    }
  }

  return (
    <div className="flex items-stretch gap-sm w-full">
      <ProjectSteps
        currentSlug={stepSlug}
        visitedSlugs={state.visitedSteps}
        completedSlugs={formulatorSteps.filter((e) => isStepComplete(e.slug, state)).map((e) => e.slug)}
        onSelect={goToSlug}
      />

      <FormCard
        titulo={step.title}
        subtitle={step.subtitle}
        currentIndex={index}
        onPrev={onPrev}
        onNext={onNext}
      >
        <StepForm slug={stepSlug} />
      </FormCard>
    </div>
  )
}
