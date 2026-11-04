// Cliente mínimo do OpenRouter (API OpenAI-compatível) via fetch puro — sem SDK.
// Roda na function da Vercel e no middleware de dev do Vite (mesma fonte).
import { MAX_TOKENS, sanitizeCompletion } from './llm.js'
import type { LlmMessage } from './llm.js'

// Catálogo :free rotaciona — conferir em https://openrouter.ai/api/v1/models.
// Override por OPENROUTER_MODEL (Vercel env / .env.local).
export const DEFAULT_FREE_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const TIMEOUT_MS = 30_000

export interface OpenRouterEnv {
  apiKey: string
  model: string
  // Teto por task, quando o default não serve. Pedir um limite de palavras no
  // prompt orienta mas não garante (medido: para um pedido de 110 palavras o
  // modelo entregou entre 103 e 150), e o teto garante do jeito errado — a
  // única coisa que ele sabe fazer é interromper a geração no meio. Use-o como
  // proteção contra resposta desgovernada, nunca para caber num espaço da tela.
  maxTokens?: number
}

// Tokens cobrados pela chamada, para a linha de uso do log. Ausentes quando a
// resposta não traz `usage` — o campo é opcional na API do OpenRouter.
export interface OpenRouterUsage {
  inputTokens?: number
  outputTokens?: number
}

export interface OpenRouterCompletion {
  text: string
  usage: OpenRouterUsage
}

export class OpenRouterError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'OpenRouterError'
    this.status = status
  }
}

export async function callOpenRouter(
  messages: LlmMessage[],
  env: OpenRouterEnv,
): Promise<OpenRouterCompletion> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.apiKey}`,
        'Content-Type': 'application/json',
        // Atribuição opcional do OpenRouter (aparece no ranking deles).
        'HTTP-Referer': 'https://opp-sebrae.vercel.app',
        'X-Title': 'PIPPA',
      },
      body: JSON.stringify({
        model: env.model,
        messages,
        max_tokens: env.maxTokens ?? MAX_TOKENS,
        temperature: 0.7,
        // Modelos reasoning (ex.: Nemotron 3) vazam a cadeia de raciocínio no
        // content e estouram o max_tokens antes da resposta — desliga.
        reasoning: { enabled: false },
      }),
      signal: controller.signal,
    })
  } catch (err) {
    // Abort (timeout) ou falha de rede — ambos viram erro de upstream.
    throw new OpenRouterError(0, err instanceof Error ? err.message : 'network error')
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new OpenRouterError(res.status, `OpenRouter respondeu ${res.status}: ${body.slice(0, 300)}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }
  const choice = data.choices?.[0]
  const content = choice?.message?.content
  if (!content) {
    throw new OpenRouterError(0, 'resposta do OpenRouter sem conteúdo')
  }
  // Markdown é preservado — o frontend renderiza (MarkdownLite).
  const text = sanitizeCompletion(content)
  // Só raciocínio na resposta: sobra vazio. Trata como resposta ausente, o mesmo
  // caminho do content vazio — a UI mostra erro em vez de um balão em branco.
  if (!text) {
    throw new OpenRouterError(0, 'resposta do OpenRouter sem conteúdo utilizável')
  }
  return {
    text,
    usage: {
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
    },
  }
}
