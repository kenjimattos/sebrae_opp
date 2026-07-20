// Contrato compartilhado das tasks de IA — importado pelo client (src/data/ai.ts)
// e pelo endpoint /api/ai (api/_lib/). A união discriminada por `task` é o ponto
// de extensão: novas capacidades de IA = novo literal aqui + prompt em
// api/_lib/prompts.ts.

// Campos do Formulador com ação "Aprimorar com IA". O id espelha
// FormulatorState (slice.campo) — ver src/types/formulator.ts. Fonte única do
// allowlist: o handler valida contra este array e FIELD_INSTRUCTIONS
// (api/_lib/prompts.ts) é um Record<AiFieldId, …> — esquecer uma entrada nova
// vira erro de compilação.
export const AI_FIELD_IDS = [
  'identification.title',
  'justification.problem',
  'justification.evidence',
  'justification.impact',
  'justification.policy',
  'objectives.general',
  'targetAudience.primary',
  'targetAudience.secondary',
  'actionPlan.activities',
  'actionPlan.methodology',
  'timeline.phases',
  'timeline.milestones',
  'sustainability.continuity',
  'sustainability.partnerships',
  'governance.management',
  'governance.monitoring',
  'governance.accountability',
] as const

export type AiFieldId = (typeof AI_FIELD_IDS)[number]

export interface AiMunicipalityContext {
  id: string
  name: string
}

export interface AiIndicatorContext {
  id: string
  label: string
  value: string | number
  status: string
  unit?: string
}

export interface AiChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type AiTaskRequest =
  | {
      task: 'indicator-question'
      question: string
      indicator: AiIndicatorContext
      municipality: AiMunicipalityContext
    }
  | {
      task: 'improve-field'
      field: AiFieldId
      // Texto atual do campo; vazio → o modelo rascunha uma sugestão em vez
      // de aprimorar.
      text: string
      municipality: AiMunicipalityContext
      // Campos vizinhos para fundamentar (ex.: { problema: ... } ao melhorar
      // evidências).
      context?: Record<string, string>
    }
  | {
      task: 'generate-specific-objectives'
      general: string
      municipality: AiMunicipalityContext
      count?: number
    }
  | {
      task: 'generate-indicators'
      // Grupo da etapa 7 — espelha as chaves de IndicatorsFormData.
      group: 'results' | 'impact' | 'quantitative'
      // Objetivos específicos preenchidos; o modelo devolve um item por
      // objetivo, na mesma ordem.
      objectives: string[]
      municipality: AiMunicipalityContext
      context?: Record<string, string>
    }
  | {
      task: 'chat'
      // Histórico completo da conversa (client limita às últimas mensagens).
      messages: AiChatMessage[]
      municipality: AiMunicipalityContext
      // Resumo compacto dos indicadores do município, montado no client a
      // partir de IndicatorsData — a function na Vercel não alcança o banco.
      indicatorsSummary?: string
    }

export interface AiSuccessResponse {
  text: string
  // Presente apenas nas tasks de lista (generate-specific-objectives,
  // generate-indicators): resultado já parseado, uma entrada por linha.
  items?: string[]
}

export type AiErrorCode = 'rate_limited' | 'bad_request' | 'missing_key' | 'upstream_error'

export interface AiErrorResponse {
  error: string
  code: AiErrorCode
}
