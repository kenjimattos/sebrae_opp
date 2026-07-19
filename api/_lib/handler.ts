// Núcleo transport-agnóstico do endpoint /api/ai — usado pela function da
// Vercel (api/ai.ts) e pelo middleware de dev do Vite (vite.config.ts).
import type {
  AiChatMessage,
  AiErrorResponse,
  AiFieldId,
  AiSuccessResponse,
  AiTaskRequest,
} from '../../src/types/ai.js'
import { buildMessages } from './prompts.js'
import { callOpenRouter, DEFAULT_FREE_MODEL, OpenRouterError } from './openrouter.js'

export interface AiHandlerResult {
  status: number
  body: AiSuccessResponse | AiErrorResponse
}

const FIELD_IDS: AiFieldId[] = [
  'identification.title',
  'justification.problem',
  'justification.evidence',
  'justification.impact',
  'justification.policy',
  'objectives.general',
]

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isMunicipality(v: unknown): v is { id: string; name: string } {
  return isRecord(v) && typeof v.id === 'string' && typeof v.name === 'string'
}

function isChatMessage(v: unknown): v is AiChatMessage {
  return (
    isRecord(v) &&
    (v.role === 'user' || v.role === 'assistant') &&
    typeof v.content === 'string'
  )
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
      if (
        typeof raw.text !== 'string' ||
        !FIELD_IDS.includes(raw.field as AiFieldId)
      ) {
        return null
      }
      let context: Record<string, string> | undefined
      if (raw.context !== undefined) {
        if (!isRecord(raw.context)) return null
        context = {}
        for (const [k, v] of Object.entries(raw.context)) {
          if (typeof v !== 'string') return null
          context[k] = v
        }
      }
      return {
        task: 'improve-field',
        field: raw.field as AiFieldId,
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

// Respostas de lista → string[]: uma entrada por linha, sem marcadores/numeração.
function parseItems(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter((line) => line !== '')
    .slice(0, 6)
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
    })
    const body: AiSuccessResponse =
      req.task === 'generate-specific-objectives' ? { text, items: parseItems(text) } : { text }
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
