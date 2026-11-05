// Contrato compartilhado das tasks de IA — importado pelo client (src/data/ai.ts)
// e pelo endpoint /api/ai (api/_lib/). A união discriminada por `task` é o ponto
// de extensão: novas capacidades de IA = novo literal aqui + prompt em
// api/_lib/prompts.ts.

import type { StatusType } from './indicators.js'

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

// Chaves que o Formulador manda em `context` (os campos vizinhos que fundamentam
// a sugestão, em src/components/formulator/steps/). Allowlist pelo mesmo motivo
// do AI_FIELD_IDS: o handler recusa chave fora dela, porque cada chave vira uma
// linha do prompt, e a tipagem de `context` faz o frontend errar na compilação,
// não em produção. Chave nova lá = entrada aqui.
export const AI_CONTEXT_KEYS = [
  'problema',
  'objetivoGeral',
  'objetivosEspecificos',
  'atividades',
  'duracao',
  'fases',
  'parcerias',
  'publicoAlvo',
  'publicoPrincipal',
  'continuidade',
  'gestao',
  'monitoramento',
  'indicadoresProjeto',
] as const

export type AiContextKey = (typeof AI_CONTEXT_KEYS)[number]
export type AiContext = Partial<Record<AiContextKey, string>>

export interface AiMunicipalityContext {
  id: string
  name: string
}

export interface AiIndicatorContext {
  id: string
  label: string
  value: string | number
  status: StatusType
  unit?: string
}

export interface AiChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Um card da base econômica, como exibido no modo "Panorama Socioeconômico".
// Estruturado (e não um resumo em texto) de propósito: o prompt proíbe o modelo
// de citar qualquer número fora desta lista, e a lista vem da API — foi assim que
// a análise antiga, com valores fixos no código, passou a contradizer os cards.
export interface AiEconomicBaseItem {
  label: string
  value: string
  referenceYear?: string
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
      context?: AiContext
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
      context?: AiContext
    }
  | {
      task: 'suggest-budget-items'
      // Atividades previstas (plano de ação) — base das rubricas sugeridas.
      // O modelo devolve apenas nomes de rubrica, nunca valores em R$.
      activities: string
      municipality: AiMunicipalityContext
      context?: AiContext
    }
  | {
      task: 'economic-analysis'
      municipality: AiMunicipalityContext
      // Os cards do Panorama (modo Economics). Única fonte de números que o
      // modelo pode citar.
      economicBase: AiEconomicBaseItem[]
      // Indicadores de agenda (label: valor (status)) para a leitura apontar
      // riscos e oportunidades, como promete o subtítulo do bloco.
      indicatorsSummary?: string
    }
  | {
      task: 'chat'
      // Histórico completo da conversa (client limita às últimas mensagens).
      messages: AiChatMessage[]
      municipality: AiMunicipalityContext
      // Resumo compacto dos indicadores do município, montado no client a
      // partir de IndicatorsData — o handler de IA não lê o banco.
      indicatorsSummary?: string
      // Emendas parlamentares do município, uma seção por esfera (nunca somadas),
      // montado por `emendasAiSummary` a partir de GET /api/emendas.
      emendasSummary?: string
    }

export interface AiSuccessResponse {
  text: string
  // Presente apenas nas tasks de lista (generate-specific-objectives,
  // generate-indicators, suggest-budget-items): resultado já parseado, uma
  // entrada por linha.
  items?: string[]
}

// `unavailable` era `missing_key` — o próprio código contava ao cliente que a
// chave faltava.
export type AiErrorCode =
  | 'rate_limited'
  | 'bad_request'
  | 'unavailable'
  | 'upstream_error'
  // Pedido fora do tema da plataforma, ou barrado pelo filtro de conteúdo.
  | 'out_of_scope'

export interface AiErrorResponse {
  error: string
  code: AiErrorCode
}
