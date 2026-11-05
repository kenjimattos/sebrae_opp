// Núcleo transport-agnóstico do endpoint /api/ai — usado pelo
// middleware de dev do Vite (vite.config.ts) e pela rota do Fastify (server/src/routes.ts). O modelo é o Gemini, via Vertex AI.
import type {
  AiChatMessage,
  AiContext,
  AiContextKey,
  AiEconomicBaseItem,
  AiErrorResponse,
  AiFieldId,
  AiSuccessResponse,
  AiTaskRequest,
} from '../../src/types/ai.js'
import { AI_CONTEXT_KEYS, AI_FIELD_IDS } from '../../src/types/ai.js'
import type { StatusType } from '../../src/types/indicators.js'
import {
  IDENTITY_REPLY,
  isOutOfScope,
  revealsInstructions,
  revealsModelIdentity,
} from './guardrails.js'
import { buildMessages } from './prompts.js'
import { callVertex, VertexBlockedError, VertexError } from './vertex.js'
import type { VertexEnv, VertexUsage } from './vertex.js'

export interface AiHandlerResult {
  status: number
  body: AiSuccessResponse | AiErrorResponse
}

// Teto de tamanho de todo texto que vem do cliente: cada caractere vira token de
// entrada pago, e sem teto o /api/ai aceita qualquer coisa até o bodyLimit do
// transporte. Passou do teto, a requisição volta 400 — cortar em silêncio
// mandaria ao modelo um texto pela metade sem ninguém saber. Exceções de hoje:
// o indicatorsSummary é cortado em 4000 caracteres, e card ou objetivo inválido
// é descartado (ver os parsers abaixo).
//
// Folgado de propósito: os campos do Formulador são textarea sem maxLength, e um
// projeto real escrito à mão não pode bater aqui. Quem segura volume é o rate
// limit do transporte, não este teto.
export const INPUT_LIMITS = {
  // Pergunta do modal e cada mensagem do chat (as do assistente também: o
  // histórico vem do cliente e pode ser forjado).
  question: 2000,
  // Texto de campo do Formulador, objetivo geral, atividades e cada valor de context.
  longText: 6000,
  // Rótulo e valor de indicador ou de card da base econômica.
  shortText: 200,
  municipalityName: 60,
  // Resumo de emendas do chat (as duas esferas). O maior dos 223 municípios tem
  // ~1.700 caracteres; o teto deixa folga para função ou ano a mais.
  emendasSummary: 4000,
} as const

const STATUSES: readonly StatusType[] = ['success', 'warning', 'alert', 'none']

function isText(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length <= max
}

function isNonEmptyText(v: unknown, max: number): v is string {
  return isText(v, max) && v.trim() !== ''
}

function isAiFieldId(v: unknown): v is AiFieldId {
  return typeof v === 'string' && (AI_FIELD_IDS as readonly string[]).includes(v)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

// O município entra no prompt em todas as tasks, e o cliente é quem o manda.
// Código IBGE da PB (25 + 5 dígitos) e nome só com letras, espaço, hífen,
// apóstrofo e ponto ("Olho d'Água", "São José do Rio do Peixe"): quebra de linha e
// símbolo não têm o que fazer num nome de município, e é por eles que uma
// instrução entraria disfarçada.
const MUNICIPALITY_ID = /^25\d{5}$/
const MUNICIPALITY_NAME = /^[\p{L}][\p{L} '’.-]*$/u

function isMunicipality(v: unknown): v is { id: string; name: string } {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    MUNICIPALITY_ID.test(v.id) &&
    isText(v.name, INPUT_LIMITS.municipalityName) &&
    MUNICIPALITY_NAME.test(v.name)
  )
}

function isEconomicBaseItem(v: unknown): v is AiEconomicBaseItem {
  return (
    isRecord(v) &&
    isText(v.label, INPUT_LIMITS.shortText) &&
    isText(v.value, INPUT_LIMITS.shortText)
  )
}

function isChatMessage(v: unknown): v is AiChatMessage {
  return (
    isRecord(v) &&
    (v.role === 'user' || v.role === 'assistant') &&
    isText(v.content, INPUT_LIMITS.question)
  )
}

function isContextKey(k: string): k is AiContextKey {
  return (AI_CONTEXT_KEYS as readonly string[]).includes(k)
}

// Context opcional das tasks: só chaves do allowlist e valores dentro do teto.
// undefined se ausente, null se malformado (→ 400).
function parseContext(v: unknown): AiContext | undefined | null {
  if (v === undefined) return undefined
  if (!isRecord(v)) return null
  const context: AiContext = {}
  for (const [k, val] of Object.entries(v)) {
    if (!isContextKey(k) || !isText(val, INPUT_LIMITS.longText)) return null
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
        !isNonEmptyText(raw.question, INPUT_LIMITS.question) ||
        !isRecord(ind) ||
        !isText(ind.id, INPUT_LIMITS.shortText) ||
        !isText(ind.label, INPUT_LIMITS.shortText) ||
        (!isText(ind.value, INPUT_LIMITS.shortText) && typeof ind.value !== 'number') ||
        !STATUSES.includes(ind.status as StatusType) ||
        (ind.unit !== undefined && !isText(ind.unit, INPUT_LIMITS.shortText))
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
          status: ind.status as StatusType,
          unit: typeof ind.unit === 'string' ? ind.unit : undefined,
        },
        municipality: raw.municipality,
      }
    }

    case 'improve-field': {
      if (!isText(raw.text, INPUT_LIMITS.longText) || !isAiFieldId(raw.field)) {
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
      if (!isNonEmptyText(raw.general, INPUT_LIMITS.longText)) return null
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
        .filter((o): o is string => isNonEmptyText(o, INPUT_LIMITS.longText))
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
      if (!isNonEmptyText(raw.activities, INPUT_LIMITS.longText)) return null
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
      // A última tem de ser do usuário: é a pergunta. Alternância estrita
      // user/assistant não dá para exigir, porque o ChatPanel tira do histórico as
      // respostas que falharam e sobram duas do usuário seguidas.
      if (raw.messages.at(-1)?.role !== 'user') return null
      if (raw.emendasSummary !== undefined && !isText(raw.emendasSummary, INPUT_LIMITS.emendasSummary))
        return null
      return {
        task: 'chat',
        // Guarda-corpo de tamanho: só as últimas 12 mensagens.
        messages: raw.messages.slice(-12),
        municipality: raw.municipality,
        indicatorsSummary:
          typeof raw.indicatorsSummary === 'string'
            ? raw.indicatorsSummary.slice(0, 4000)
            : undefined,
        emendasSummary:
          typeof raw.emendasSummary === 'string' && raw.emendasSummary.trim() !== ''
            ? raw.emendasSummary
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
// A análise do município teve teto de 260, quando ainda morava sob os cards do
// Panorama. Medindo com o prompt real (12 municípios, teto solto), o modelo
// escreve entre 182 e 275 tokens — a mediana fica em 198, mas a cauda passa do
// teto: Campina Grande quis 275. O teto não
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

export interface AiEnv {
  // Ausente quando GOOGLE_SERVICE_ACCOUNT_JSON falta ou é inválida (ver vertexEnvFrom).
  vertex?: VertexEnv
}

// Tasks em que a resposta é conversa (chat e modal). Nelas, quando a resposta
// cita o modelo ou recita as instruções, o texto vira a frase fixa IDENTITY_REPLY.
// Nas outras o texto vira campo de formulário ou bloco da página, e a mesma troca
// gravaria a frase fixa no projeto — lá toda guarda de saída vira erro
// `out_of_scope`, que o campo mostra como aviso, sem gravar nada.
const CONVERSATIONAL: ReadonlySet<AiTaskRequest['task']> = new Set(['chat', 'indicator-question'])

const OUT_OF_SCOPE: AiHandlerResult = {
  status: 422,
  body: { error: 'Pedido fora do tema.', code: 'out_of_scope' },
}

type OutputGuard = 'scope' | 'identity' | 'instructions'

// Guardas determinísticas sobre a saída: o prompt pede, estas garantem.
function outputGuard(text: string): OutputGuard | null {
  if (isOutOfScope(text)) return 'scope'
  if (revealsModelIdentity(text)) return 'identity'
  if (revealsInstructions(text)) return 'instructions'
  return null
}

// O que a linha de uso registra além do status. Preenchido por runTask enquanto
// a chamada anda.
interface UsageNotes {
  usage?: VertexUsage
  guard?: OutputGuard | 'blocked'
}

// Uma linha por chamada, para ver abuso e custo no journalctl: task, status,
// código, tamanho do corpo, tokens cobrados, duração e qual guarda disparou.
// **Sem o texto** da pergunta nem da resposta — o log não é lugar disso (LGPD), e
// o tamanho já diz o que importa para achar abuso. O IP fica no log do Fastify.
function logUsage(
  task: string,
  result: AiHandlerResult,
  rawChars: number,
  ms: number,
  notes: UsageNotes,
): void {
  const code = 'code' in result.body ? result.body.code : undefined
  console.info(
    '[api/ai] uso',
    JSON.stringify({
      task,
      status: result.status,
      ...(code && { code }),
      chars: rawChars,
      ...(notes.usage?.inputTokens !== undefined && { tokensIn: notes.usage.inputTokens }),
      ...(notes.usage?.outputTokens !== undefined && { tokensOut: notes.usage.outputTokens }),
      ms,
      ...(notes.guard && { guard: notes.guard }),
    }),
  )
}

function bodyChars(raw: unknown): number {
  try {
    return JSON.stringify(raw ?? null).length
  } catch {
    return 0
  }
}

export async function handleAiTask(rawBody: unknown, env: AiEnv): Promise<AiHandlerResult> {
  const started = Date.now()
  const notes: UsageNotes = {}
  const req = parseRequest(rawBody)
  const result = req
    ? await runTask(req, env, notes)
    : { status: 400, body: { error: 'Requisição inválida.', code: 'bad_request' as const } }
  logUsage(req?.task ?? 'invalida', result, bodyChars(rawBody), Date.now() - started, notes)
  return result
}

async function runTask(
  req: AiTaskRequest,
  env: AiEnv,
  notes: UsageNotes,
): Promise<AiHandlerResult> {
  // Corpo de erro é genérico em todos os ramos: ele chega ao navegador, e o
  // que antes ia nele (fornecedor, nome da variável de ambiente, "modelo
  // gratuito", o corpo cru do upstream com o id do modelo) é mapa para quem
  // quer abusar — dá até para esgotar a cota de propósito. O detalhe vai para
  // o log, que é onde quem mantém precisa dele.
  if (!env.vertex) {
    console.error('[api/ai] GOOGLE_SERVICE_ACCOUNT_JSON ausente ou inválida')
    return {
      status: 503,
      body: { error: 'Serviço de IA indisponível.', code: 'unavailable' },
    }
  }

  try {
    const { text: completion, usage } = await callVertex(buildMessages(req), {
      ...env.vertex,
      maxTokens: MAX_TOKENS_BY_TASK[req.task],
    })
    notes.usage = usage
    const guard = outputGuard(completion)
    if (guard) notes.guard = guard
    if (guard === 'scope' || (guard && !CONVERSATIONAL.has(req.task))) return OUT_OF_SCOPE
    // A resposta inteira é trocada, não só o trecho: frase que cita o modelo
    // costuma vir com o resto do bastidor junto ("rodo no X, via Y, com Z").
    const text = guard ? IDENTITY_REPLY : completion
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
    console.error('[api/ai]', req.task, err instanceof Error ? err.message : err)
    // Bloqueio do filtro do próprio Vertex: para quem pediu é o mesmo que fora do
    // tema, sem dizer que houve filtro.
    if (err instanceof VertexBlockedError) {
      notes.guard = 'blocked'
      return OUT_OF_SCOPE
    }
    if (err instanceof VertexError && err.status === 429) {
      return {
        status: 429,
        body: { error: 'Muitas consultas no momento.', code: 'rate_limited' },
      }
    }
    return { status: 502, body: { error: 'Falha ao gerar a resposta.', code: 'upstream_error' } }
  }
}
