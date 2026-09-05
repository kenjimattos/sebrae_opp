// Cliente mínimo do OpenRouter (API OpenAI-compatível) via fetch puro — sem SDK.
// Roda na function da Vercel e no middleware de dev do Vite (mesma fonte).

// Catálogo :free rotaciona — conferir em https://openrouter.ai/api/v1/models.
// Override por OPENROUTER_MODEL (Vercel env / .env.local).
export const DEFAULT_FREE_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const TIMEOUT_MS = 30_000
// Folga para respostas em lista (chat) — o prompt pede ~150 palavras, mas
// modelos estouram. É teto de segurança contra resposta desgovernada, não
// controle de tamanho: o tamanho quem absorve é o layout de cada superfície.
const MAX_TOKENS = 800

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

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

export class OpenRouterError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'OpenRouterError'
    this.status = status
  }
}

/**
 * Prepara o texto do modelo para a tela. Pura e exportada de propósito: é a
 * única superfície onde texto não determinístico chega ao gestor sem revisão,
 * e testá-la não pode depender de simular a rede.
 *
 * **Remove a cadeia de raciocínio.** `reasoning.enabled: false` já pede isso ao
 * modelo, mas o catálogo `:free` rotaciona e nem todo modelo respeita — daí a
 * defesa aqui. Pares `<think>…</think>` saem inteiros; um `<think>` **sem
 * fechamento** leva junto tudo o que vem depois dele, que é o caso de uma
 * resposta interrompida no meio do raciocínio.
 *
 * **O que esta função não faz é aparar a frase incompleta de uma resposta
 * truncada.** Fazer isso exige decidir onde termina uma frase, e nenhuma regra
 * acerta: `lastIndexOf('.')` parte "R$ 3.2" ao meio; exigir espaço depois do
 * ponto quebra quando o modelo não põe espaço; qualquer variante ainda corta em
 * "art. 5", "Lei n. 14.133" e no marcador de lista numerada. Todo erro dessa
 * família produz o mesmo dano: um fragmento entregue com cara de frase pronta.
 * Deixar a cauda truncada visível é pior de ler e melhor de confiar — parece
 * cortada porque está.
 *
 * Quem absorve tamanho variável é o layout (a análise recolhe e expande, o chat
 * rola), não o corte de texto.
 */
export function sanitizeCompletion(content: string): string {
  let text = content.replace(/<think>[\s\S]*?<\/think>/g, '')

  const abertoSemFechar = text.indexOf('<think>')
  if (abertoSemFechar !== -1) text = text.slice(0, abertoSemFechar)

  return text.trim()
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
  return text
}
