// Rota /formulador/:stepSlug — despacha para o form da etapa correta.
// Layout interno: ProjectSteps (esquerda) + FormCard (centro).

import { useEffect, useRef } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import ProjectSteps from '@/components/formulador/ProjectSteps'
import FormCard from '@/components/formulador/FormCard'
import { etapasFormulador, findEtapaIndex, findEtapaBySlug } from '@/data/formulador-etapas'
import { useFormulador } from '@/hooks/useFormulador'
import { StepForm } from '@/components/formulador/steps'
import { isEtapaCompleta } from '@/utils/formuladorCompleteness'
import { trackEvent } from '@/utils/analytics'

export default function FormuladorStep() {
  const { stepSlug = '' } = useParams()
  const navigate = useNavigate()
  const { state, markVisited } = useFormulador()
  const stepStartRef = useRef<number>(Date.now())

  const etapa = findEtapaBySlug(stepSlug)
  const index = findEtapaIndex(stepSlug)

  // Dispara `formulador_step_visitado` a cada step carregado e reseta o
  // cronômetro para medir tempo gasto até o próximo avanço.
  useEffect(() => {
    if (!etapa) return
    stepStartRef.current = Date.now()
    trackEvent('formulador_step_visitado', {
      step: stepSlug,
      numero: index + 1,
    })
  }, [stepSlug, etapa, index])

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
    trackEvent('formulador_step_concluido', {
      step: stepSlug,
      numero: index + 1,
      tempo_ms: Date.now() - stepStartRef.current,
    })
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
