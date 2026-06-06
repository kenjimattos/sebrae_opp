// Fluxo completo do Formulador, auto-contido — navegação por estado local
// (sem React Router). Renderizado como painel do pilar "Formulador" dentro da
// SectionJornada: barra de progresso + (etapas | conclusão).

import { useEffect, useRef, useState } from 'react'
import FormulatorProgress from '@/components/formulator/FormulatorProgress'
import ProjectSteps from '@/components/formulator/FormulatorProjectSteps'
import FormCard from '@/components/formulator/FormCard'
import FormulatorReview from '@/components/formulator/FormulatorReview'
import { StepForm } from '@/components/formulator/steps'
import { formulatorSteps, findStepBySlug, findStepIndex } from '@/data/formulator/steps'
import { useFormulator } from '@/hooks/useFormulator'
import { countCompletedSteps, isStepComplete } from '@/utils/formulatorCompleteness'
import { trackEvent } from '@/utils/analytics'

export default function ModeFormulator() {
  const { state, markVisited } = useFormulator()
  const [currentSlug, setCurrentSlug] = useState(formulatorSteps[0].slug)
  const [finalized, setFinalized] = useState(false)
  const stepStartRef = useRef<number>(0)

  const index = findStepIndex(currentSlug)
  const step = findStepBySlug(currentSlug)
  const isLast = index === formulatorSteps.length - 1

  const completedSlugs = formulatorSteps
    .filter((e) => isStepComplete(e.slug, state))
    .map((e) => e.slug)

  // currentIndex === total sinaliza "Conclusão" para o FormulatorProgress.
  const currentIndex = finalized ? formulatorSteps.length : index
  const percent = Math.min(
    100,
    (countCompletedSteps(state) / formulatorSteps.length) * 100,
  )

  // Evento único por sessão de Formulador (dispara no primeiro mount).
  useEffect(() => {
    trackEvent('formulador_iniciado')
  }, [])

  // Dispara `formulador_step_visitado` a cada step e reseta o cronômetro para
  // medir o tempo gasto até o próximo avanço.
  useEffect(() => {
    if (finalized || !step) return
    stepStartRef.current = Date.now()
    trackEvent('formulador_step_visitado', {
      step: currentSlug,
      numero: index + 1,
    })
  }, [currentSlug, finalized, step, index])

  function goToSlug(slug: string) {
    setFinalized(false)
    setCurrentSlug(slug)
  }

  function onPrev() {
    if (index - 1 >= 0) goToSlug(formulatorSteps[index - 1].slug)
  }

  function onNext() {
    markVisited(currentSlug)
    trackEvent('formulador_step_concluido', {
      step: currentSlug,
      numero: index + 1,
      tempo_ms: Date.now() - stepStartRef.current,
    })
    if (isLast) {
      setFinalized(true)
    } else {
      goToSlug(formulatorSteps[index + 1].slug)
    }
  }

  // "Voltar para home" da conclusão: volta para a primeira etapa e leva o
  // usuário ao topo da página.
  function onHome() {
    goToSlug(formulatorSteps[0].slug)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="flex flex-col items-start gap-sm w-full">
      <FormulatorProgress currentIndex={currentIndex} percent={percent} />

      {finalized || !step ? (
        <FormulatorReview onEdit={() => setFinalized(false)} onHome={onHome} />
      ) : (
        <div className="flex items-stretch gap-sm w-full">
          <ProjectSteps
            currentSlug={currentSlug}
            visitedSlugs={state.visitedSteps}
            completedSlugs={completedSlugs}
            onSelect={goToSlug}
          />

          <FormCard
            titulo={step.title}
            subtitle={step.subtitle}
            currentIndex={index}
            onPrev={onPrev}
            onNext={onNext}
          >
            <StepForm slug={currentSlug} />
          </FormCard>
        </div>
      )}
    </section>
  )
}
