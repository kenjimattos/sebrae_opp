// Fluxo completo do Formulador, auto-contido — navegação por estado local
// (sem React Router). Renderizado como painel do pilar "Formulador" dentro da
// SectionJornada: barra de progresso + (etapas | conclusão).

import { useState } from 'react'
import FormulatorProgress from '@/components/formulator/FormulatorProgress'
import ProjectSteps from '@/components/formulator/FormulatorProjectSteps'
import Form from '@/components/formulator/FormulatorForm'
import FormulatorReview from '@/components/formulator/FormulatorReview'
import AIAssistant from '@/components/formulator/AIAssistant'
import { StepForm } from '@/components/formulator/steps'
import { formulatorSteps, findStepBySlug, findStepIndex } from '@/data/formulator/steps'
import { aiAssistantByStep } from '@/data/formulator/ai-assistant'
import { useFormulator } from '@/hooks/useFormulator'
import { countCompletedSteps, isStepComplete } from '@/utils/formulatorCompleteness'

export default function ModeFormulator() {
  const { state, markVisited } = useFormulator()
  const [currentSlug, setCurrentSlug] = useState(formulatorSteps[0].slug)
  const [finalized, setFinalized] = useState(false)
  const assistantContent = aiAssistantByStep[currentSlug]

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

  function goToSlug(slug: string) {
    setFinalized(false)
    setCurrentSlug(slug)
  }

  function onPrev() {
    if (index - 1 >= 0) goToSlug(formulatorSteps[index - 1].slug)
  }

  function onNext() {
    markVisited(currentSlug)
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
    <section className="flex flex-col gap-sm w-full flex-1 min-h-0">
      <FormulatorProgress currentIndex={currentIndex} percent={percent} />

      {finalized || !step ? (
        <FormulatorReview onEdit={() => setFinalized(false)} onHome={onHome} />
      ) : (
        <div className="flex items-stretch gap-sm w-full flex-1 min-h-0">
          <ProjectSteps
            currentSlug={currentSlug}
            visitedSlugs={state.visitedSteps}
            completedSlugs={completedSlugs}
            onSelect={goToSlug}
          />

          <Form
            titulo={step.title}
            subtitle={step.subtitle}
            currentIndex={index}
            onPrev={onPrev}
            onNext={onNext}
          >
            <StepForm slug={currentSlug} />
          </Form>

          {assistantContent && (
            <AIAssistant
              content={assistantContent}
              className="shrink-0"
            />
          )}
        </div>
      )}
    </section>
  )
}
