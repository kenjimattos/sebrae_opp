// Núcleo transport-agnóstico do endpoint /api/ai — usado pela function da
// Vercel (api/ai.ts) e pelo middleware de dev do Vite (vite.config.ts).
import type {
  AiChatMessage,
  AiEconomicBaseItem,
  AiErrorResponse,
  AiFieldId,
  AiSuccessResponse,
  AiTaskRequest,
} from '../../src/types/ai.js'
import { AI_FIELD_IDS } from '../../src/types/ai.js'
import { buildMessages } from './prompts.js'
import { callOpenRouter, DEFAULT_FREE_MODEL, OpenRouterError } from './openrouter.js'

export interface AiHandlerResult {
  status: number
  body: AiSuccessResponse | AiErrorResponse
}

function isAiFieldId(v: unknown): v is AiFieldId {
  return typeof v === 'string' && (AI_FIELD_IDS as readonly string[]).includes(v)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isMunicipality(v: unknown): v is { id: string; name: string } {
  return isRecord(v) && typeof v.id === 'string' && typeof v.name === 'string'
}

function isEconomicBaseItem(v: unknown): v is AiEconomicBaseItem {
  return isRecord(v) && typeof v.label === 'string' && typeof v.value === 'string'
}

function isChatMessage(v: unknown): v is AiChatMessage {
  return (
    isRecord(v) &&
    (v.role === 'user' || v.role === 'assistant') &&
    typeof v.content === 'string'
  )
}

// Context opcional das tasks: Record<string,string> válido, undefined se
// ausente, null se malformado (→ 400).
function parseContext(v: unknown): Record<string, string> | undefined | null {
  if (v === undefined) return undefined
  if (!isRecord(v)) return null
  const context: Record<string, string> = {}
  for (const [k, val] of Object.entries(v)) {
    if (typeof val !== 'string') return null
    context[k] = val
  }
  return context
}

// Valida o body cru (unknown) e o estreita para AiTaskRequest.
function parseRequest(raw: unknown): AiTaskRequest | null {
  if (!isRecord(raw) || !isMunicipality(raw.municipality)) return null

  switch (raw.task) {
    case 'indicator-question': {
      const ind = raw.indicator
      if (
        typeof raw.question !== 'string' ||
        raw.question.trim() === '' ||
        !isRecord(ind) ||
        typeof ind.id !== 'string' ||
        typeof ind.label !== 'string' ||
        (typeof ind.value !== 'string' && typeof ind.value !== 'number') ||
        typeof ind.status !== 'string'
      ) {
        return null
      }
      return {
        task: 'indicator-question',
        question: raw.question,
        indicator: {
          id: ind.id,
          label: ind.label,
          value: ind.value,
          status: ind.status,
          unit: typeof ind.unit === 'string' ? ind.unit : undefined,
        },
        municipality: raw.municipality,
      }
    }

    case 'improve-field': {
      if (typeof raw.text !== 'string' || !isAiFieldId(raw.field)) {
        return null
      }
      const context = parseContext(raw.context)
      if (context === null) return null
      return {
        task: 'improve-field',
        field: raw.field,
        text: raw.text,
        municipality: raw.municipality,
        context,
      }
    }

    case 'generate-specific-objectives': {
      if (typeof raw.general !== 'string' || raw.general.trim() === '') return null
      const count =
        typeof raw.count === 'number' && Number.isFinite(raw.count)
          ? Math.min(Math.max(Math.round(raw.count), 2), 6)
          : undefined
      return {
        task: 'generate-specific-objectives',
        general: raw.general,
        municipality: raw.municipality,
        count,
      }
    }

    case 'generate-indicators': {
      if (
        raw.group !== 'results' &&
        raw.group !== 'impact' &&
        raw.group !== 'quantitative'
      ) {
        return null
      }
      if (!Array.isArray(raw.objectives)) return null
      const objectives = raw.objectives
        .filter((o): o is string => typeof o === 'string' && o.trim() !== '')
        .slice(0, 10)
      if (objectives.length === 0) return null
      const context = parseContext(raw.context)
      if (context === null) return null
      return {
        task: 'generate-indicators',
        group: raw.group,
        objectives,
        municipality: raw.municipality,
        context,
      }
    }

    case 'suggest-budget-items': {
      if (typeof raw.activities !== 'string' || raw.activities.trim() === '') return null
      const context = parseContext(raw.context)
      if (context === null) return null
      return {
        task: 'suggest-budget-items',
        activities: raw.activities,
        municipality: raw.municipality,
        context,
      }
    }

    case 'economic-analysis': {
      if (!Array.isArray(raw.economicBase)) return null
      const economicBase = raw.economicBase.filter(isEconomicBaseItem).map((i) => ({
        label: i.label,
        value: i.value,
        referenceYear: typeof i.referenceYear === 'string' ? i.referenceYear : undefined,
      }))
      // Sem nenhum card não há o que analisar — e o modelo preencheria o vazio
      // inventando números, exatamente o que a task existe para evitar.
      if (economicBase.length === 0) return null
      return {
        task: 'economic-analysis',
        municipality: raw.municipality,
        economicBase: economicBase.slice(0, 24),
        indicatorsSummary:
          typeof raw.indicatorsSummary === 'string'
            ? raw.indicatorsSummary.slice(0, 4000)
            : undefined,
      }
    }

    case 'chat': {
      if (!Array.isArray(raw.messages) || raw.messages.length === 0) return null
      if (!raw.messages.every(isChatMessage)) return null
      return {
        task: 'chat',
        // Guarda-corpo de tamanho: só as últimas 12 mensagens.
        messages: raw.messages.slice(-12),
        municipality: raw.municipality,
        indicatorsSummary:
          typeof raw.indicatorsSummary === 'string'
            ? raw.indicatorsSummary.slice(0, 4000)
            : undefined,
      }
    }

    default:
      return null
  }
}

// Teto de tokens por task, onde o default de 800 não serve. Hoje nenhuma task
// precisa disso.
//
// A análise do Panorâma teve teto de 260 até esta versão, para caber no bloco
// sob os cards. Medindo com o prompt real (12 municípios, teto solto), o modelo
// escreve entre 182 e 275 tokens — a mediana fica em 198, mas a cauda passa do
// teto: Campina Grande, o município default da plataforma, quis 275. O teto não
// segurava tamanho, produzia corte no meio da frase em ~1 a cada 10 análises.
//
// Tamanho de texto de modelo não se controla por teto de token, porque a única
// coisa que o teto sabe fazer é truncar. O pedido de 110 palavras no prompt
// puxa o texto para a faixa certa (as amostras vieram entre 103 e 150), e quem
// absorve o que sobra é o layout: o bloco da análise recolhe e expande.
const MAX_TOKENS_BY_TASK: Partial<Record<AiTaskRequest['task'], number>> = {}

// Respostas de lista → string[]: uma entrada por linha, sem marcadores/numeração.
function parseItems(text: string, max = 6): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter((line) => line !== '')
    .slice(0, max)
}

export async function handleAiTask(
  rawBody: unknown,
  env: { apiKey?: string; model?: string },
): Promise<AiHandlerResult> {
  const req = parseRequest(rawBody)
  if (!req) {
    return { status: 400, body: { error: 'Requisição inválida.', code: 'bad_request' } }
  }
  if (!env.apiKey) {
    return {
      status: 500,
      body: { error: 'OPENROUTER_API_KEY não configurada.', code: 'missing_key' },
    }
  }

  try {
    const text = await callOpenRouter(buildMessages(req), {
      apiKey: env.apiKey,
      model: env.model || DEFAULT_FREE_MODEL,
      maxTokens: MAX_TOKENS_BY_TASK[req.task],
    })
    const body: AiSuccessResponse =
      req.task === 'generate-specific-objectives'
        ? { text, items: parseItems(text) }
        : req.task === 'generate-indicators'
          ? { text, items: parseItems(text, req.objectives.length) }
          : req.task === 'suggest-budget-items'
            ? { text, items: parseItems(text, 8) }
            : { text }
    return { status: 200, body }
  } catch (err) {
    if (err instanceof OpenRouterError && err.status === 429) {
      return {
        status: 429,
        body: { error: 'Limite de requisições do modelo gratuito atingido.', code: 'rate_limited' },
      }
    }
    const message = err instanceof Error ? err.message : 'erro desconhecido'
    return { status: 502, body: { error: message, code: 'upstream_error' } }
  }
}
