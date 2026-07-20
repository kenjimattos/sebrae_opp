// Cliente mínimo do OpenRouter (API OpenAI-compatível) via fetch puro — sem SDK.
// Roda na function da Vercel e no middleware de dev do Vite (mesma fonte).

// Catálogo :free rotaciona — conferir em https://openrouter.ai/api/v1/models.
// Override por OPENROUTER_MODEL (Vercel env / .env.local).
export const DEFAULT_FREE_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const TIMEOUT_MS = 30_000

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterEnv {
  apiKey: string
  model: string
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
  messages: OpenRouterMessage[],
  env: OpenRouterEnv,
): Promise<string> {
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
        'X-Title': 'Plataforma OPP',
      },
      body: JSON.stringify({
        model: env.model,
        messages,
        max_tokens: 500,
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
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new OpenRouterError(0, 'resposta do OpenRouter sem conteúdo')
  }
  // Defesa extra caso o modelo configurado ignore reasoning.enabled=false e
  // emita a cadeia de raciocínio inline entre tags <think>.
  return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}
