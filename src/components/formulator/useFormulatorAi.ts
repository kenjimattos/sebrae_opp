// Liga as ações do painel AIAssistant às tasks de IA: mapeia o id da ação
// para a AiTaskRequest correspondente e grava o resultado direto no estado do
// formulador via setSlice (sem typewriter — o botão "Gerando…" é o feedback).

import { useState } from 'react'
import type { AiTaskRequest } from '@/types/ai'
import type { AiSuccessResponse } from '@/types/ai'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useAiTask } from '@/hooks/useAiTask'
import { selectTopRisks } from '@/utils/risks'
import { statusLabels } from '@/data/indicators/status-labels'

export interface UseFormulatorAiResult {
  runAction: (actionId: string) => Promise<void>
  busyActionId: string | null
  errorMessage: string | null
}

export function useFormulatorAi(): UseFormulatorAiResult {
  const { state, setSlice } = useFormulator()
  const { municipality } = useMunicipality()
  const ai = useAiTask()
  const [busyActionId, setBusyActionId] = useState<string | null>(null)

  const municipalityCtx = { id: municipality.id, name: municipality.name }

  function buildRequest(actionId: string): AiTaskRequest | null {
    switch (actionId) {
      case 'improve-title':
        return {
          task: 'improve-field',
          field: 'identification.title',
          text: state.identification.title,
          municipality: municipalityCtx,
          context:
            state.justification.problem.trim() !== ''
              ? { problema: state.justification.problem }
              : undefined,
        }
      case 'improve-problem':
        return {
          task: 'improve-field',
          field: 'justification.problem',
          text: state.justification.problem,
          municipality: municipalityCtx,
        }
      case 'draft-evidence': {
        const risksSummary = selectTopRisks(municipality.data?.agendas ?? [], 5)
          .map((r) => `${r.label}: ${r.value} (${statusLabels[r.status]})`)
          .join('; ')
        return {
          task: 'improve-field',
          field: 'justification.evidence',
          // Texto vazio de propósito → o prompt rascunha em vez de aprimorar.
          text: '',
          municipality: municipalityCtx,
          context: {
            problema: state.justification.problem,
            ...(risksSummary !== '' ? { indicadores: risksSummary } : {}),
          },
        }
      }
      case 'improve-general':
        return {
          task: 'improve-field',
          field: 'objectives.general',
          text: state.objectives.general,
          municipality: municipalityCtx,
          context: { problema: state.justification.problem },
        }
      case 'generate-specific':
        if (state.objectives.general.trim() === '') return null
        return {
          task: 'generate-specific-objectives',
          general: state.objectives.general,
          municipality: municipalityCtx,
          count: 4,
        }
      default:
        return null
    }
  }

  function applyResult(actionId: string, result: AiSuccessResponse) {
    switch (actionId) {
      case 'improve-title':
        setSlice('identification', { ...state.identification, title: result.text })
        break
      case 'improve-problem':
        setSlice('justification', { ...state.justification, problem: result.text })
        break
      case 'draft-evidence':
        setSlice('justification', { ...state.justification, evidence: result.text })
        break
      case 'improve-general':
        setSlice('objectives', { ...state.objectives, general: result.text })
        break
      case 'generate-specific':
        if (result.items && result.items.length > 0) {
          setSlice('objectives', { ...state.objectives, specific: result.items })
        }
        break
    }
  }

  async function runAction(actionId: string): Promise<void> {
    if (busyActionId !== null) return
    const req = buildRequest(actionId)
    if (!req) return
    setBusyActionId(actionId)
    try {
      const result = await ai.run(req)
      if (result) applyResult(actionId, result)
    } finally {
      setBusyActionId(null)
    }
  }

  return { runAction, busyActionId, errorMessage: ai.errorMessage }
}
