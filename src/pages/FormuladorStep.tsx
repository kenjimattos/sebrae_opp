// Rota /formulador/:stepSlug — despacha para o form da etapa correta.
// Layout interno: ProjectSteps (esquerda) + FormCard (centro) + AIAssistant (direita).

import { useParams, useNavigate, Navigate } from 'react-router-dom'
import ProjectSteps from '@/components/formulador/ProjectSteps'
import AIAssistant from '@/components/formulador/AIAssistant'
import FormCard from '@/components/formulador/FormCard'
import { etapasFormulador, findEtapaIndex, findEtapaBySlug } from '@/data/formulador-etapas'
import { useFormulador } from '@/hooks/useFormulador'
import { aiAssistantByEtapa } from '@/data/formulador-ai'
import { StepForm } from '@/components/formulador/steps'

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
  const aiContent = aiAssistantByEtapa[stepSlug]

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
    <div className="flex items-stretch gap-md w-full">
      <ProjectSteps
        currentSlug={stepSlug}
        visitedSlugs={state.etapasVisitadas}
        onSelect={goToSlug}
        className="w-[229px] shrink-0"
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

      {aiContent && <AIAssistant content={aiContent} className="shrink-0" />}
    </div>
  )
}
