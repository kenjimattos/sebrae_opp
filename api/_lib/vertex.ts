// Cliente mínimo do Vertex AI (Gemini) via fetch puro — sem SDK. A autenticação
// é de service account: assina um JWT com a chave privada (RS256, node:crypto) e
// troca por um access token no endpoint OAuth do Google. Roda no middleware de dev do Vite e no Fastify.
import { createSign } from 'node:crypto'
import { MAX_TOKENS, sanitizeCompletion } from './llm.js'
import type { LlmMessage } from './llm.js'

// Override por VERTEX_MODEL / VERTEX_LOCATION. O que existe é por projeto, não
// pela doc pública: medido em 2026-11-03, a única combinação liberada no projeto
// do Sebrae é esta. Gemini 2.0/2.5/3/3.1 deram 404, e o próprio 3.8-flash deu 404
// em us-central1, us-east4, southamerica-east1 e europe-west4. Trocar o default só
// depois de uma chamada real.
export const DEFAULT_VERTEX_MODEL = 'gemini-3.8-flash'
export const DEFAULT_VERTEX_LOCATION = 'global'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
const TIMEOUT_MS = 30_000
// Renova o token um pouco antes de vencer, para a chamada não sair com ele no limite.
const TOKEN_MARGIN_MS = 60_000

export interface VertexCredentials {
  clientEmail: string
  privateKey: string
  projectId: string
}

export interface VertexEnv {
  credentials: VertexCredentials
  model: string
  location: string
  maxTokens?: number
}

export class VertexError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'VertexError'
    this.status = status
  }
}

/**
 * Lê a configuração do Vertex de um objeto de variáveis de ambiente. Devolve
 * `undefined` quando não há credencial utilizável — o handler então responde
 * `unavailable`, sem derrubar o resto da API.
 *
 * `GOOGLE_SERVICE_ACCOUNT_JSON` é o conteúdo inteiro do arquivo da service
 * account. No .env cola-se o JSON numa linha só; os `\n` da chave privada
 * viajam escapados dentro do JSON e o `JSON.parse` os restaura.
 */
export function vertexEnvFrom(
  source: Record<string, string | undefined>,
): VertexEnv | undefined {
  const raw = source.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.error('[api/ai] GOOGLE_SERVICE_ACCOUNT_JSON não é um JSON válido')
    return undefined
  }
  if (typeof parsed !== 'object' || parsed === null) return undefined
  const sa = parsed as Record<string, unknown>
  if (
    typeof sa.client_email !== 'string' ||
    typeof sa.private_key !== 'string' ||
    typeof sa.project_id !== 'string'
  ) {
    console.error('[api/ai] GOOGLE_SERVICE_ACCOUNT_JSON sem client_email, private_key ou project_id')
    return undefined
  }

  return {
    credentials: {
      clientEmail: sa.client_email,
      privateKey: sa.private_key,
      projectId: sa.project_id,
    },
    model: source.VERTEX_MODEL || DEFAULT_VERTEX_MODEL,
    location: source.VERTEX_LOCATION || DEFAULT_VERTEX_LOCATION,
  }
}

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function signAssertion(creds: VertexCredentials, nowSec: number): string {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64Url(
    JSON.stringify({
      iss: creds.clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: nowSec,
      exp: nowSec + 3600,
    }),
  )
  const unsigned = `${header}.${claims}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(creds.privateKey)
  return `${unsigned}.${base64Url(signature)}`
}

// Cache por e-mail da service account: no processo do Fastify o token
// vale por ~1h e poupa uma ida ao OAuth a cada pergunta.
const tokenCache = new Map<string, { token: string; expiresAt: number }>()

export async function getAccessToken(
  creds: VertexCredentials,
  signal?: AbortSignal,
): Promise<string> {
  const cached = tokenCache.get(creds.clientEmail)
  if (cached && cached.expiresAt - TOKEN_MARGIN_MS > Date.now()) return cached.token

  let assertion: string
  try {
    assertion = signAssertion(creds, Math.floor(Date.now() / 1000))
  } catch (err) {
    // Chave privada malformada (ex.: \n perdidos ao colar na env var).
    throw new VertexError(0, `falha ao assinar o JWT: ${err instanceof Error ? err.message : err}`)
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new VertexError(res.status, `OAuth respondeu ${res.status}: ${body.slice(0, 300)}`)
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) throw new VertexError(0, 'OAuth sem access_token')

  tokenCache.set(creds.clientEmail, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  })
  return data.access_token
}

// `global` é um endpoint à parte: host sem prefixo de região.
function endpoint(env: VertexEnv): string {
  const host =
    env.location === 'global'
      ? 'aiplatform.googleapis.com'
      : `${env.location}-aiplatform.googleapis.com`
  return (
    `https://${host}/v1/projects/${env.credentials.projectId}` +
    `/locations/${env.location}/publishers/google/models/${env.model}:generateContent`
  )
}

// Bloqueio de conteúdo do próprio Vertex: na entrada (promptFeedback.blockReason)
// ou na saída (finishReason). É uma recusa, não uma falha — o handler a trata como
// pedido fora do tema, sem dizer ao usuário que houve filtro.
export class VertexBlockedError extends VertexError {
  constructor(reason: string) {
    super(0, `Vertex bloqueou o conteúdo (${reason})`)
    this.name = 'VertexBlockedError'
  }
}

const BLOCKED_FINISH_REASONS = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII'])

// Explícito em vez do default do modelo, que muda entre versões do Gemini: o
// texto sai com a marca Sebrae, e nenhuma das quatro categorias tem uso legítimo
// numa plataforma de política pública. BLOCK_MEDIUM_AND_ABOVE e não LOW: o mais
// estrito barra tema legítimo de política pública (violência, saúde, drogas).
const SAFETY_SETTINGS = [
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
].map((category) => ({ category, threshold: 'BLOCK_MEDIUM_AND_ABOVE' }))

// Teto do raciocínio interno do modelo. O maxOutputTokens soma raciocínio e
// resposta, e sem este teto o gemini-3.8-flash gastava até 735 dos 800 tokens
// pensando: 3 de 6 respostas de chat e modal saíam cortadas no meio da frase
// (finishReason MAX_TOKENS), e cada chamada levava ~6–7 s. Medido em 2026-11-04,
// 4 chamadas por opção, com os prompts reais:
// - thinkingLevel MINIMAL: 400, o modelo não aceita;
// - thinkingLevel LOW: 1 de 4 cortada (691 tokens pensando);
// - thinkingBudget 0: nenhuma cortada, mas não é respeitado (pensou até 190);
// - thinkingBudget 128: nenhuma cortada, sem raciocínio na conta, ~3 s.
// As tasks são redação curta sobre contexto dado, não problema de raciocínio.
const THINKING_CONFIG = { thinkingBudget: 128 }

interface GeminiPart {
  text?: string
  thought?: boolean
}

// Tokens que o Vertex cobrou na chamada, para o log de uso. Ausente quando a
// resposta não traz `usageMetadata`.
export interface VertexUsage {
  inputTokens?: number
  outputTokens?: number
}

export interface VertexCompletion {
  text: string
  usage: VertexUsage
}

export async function callVertex(
  messages: LlmMessage[],
  env: VertexEnv,
): Promise<VertexCompletion> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  // O Gemini separa a instrução de sistema do histórico, e chama o assistente de "model".
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n')
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  let res: Response
  try {
    const token = await getAccessToken(env.credentials, controller.signal)
    res = await fetch(endpoint(env), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(system && { systemInstruction: { parts: [{ text: system }] } }),
        contents,
        generationConfig: {
          maxOutputTokens: env.maxTokens ?? MAX_TOKENS,
          temperature: 0.7,
          thinkingConfig: THINKING_CONFIG,
        },
        safetySettings: SAFETY_SETTINGS,
      }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof VertexError) throw err
    // Abort (timeout) ou falha de rede — ambos viram erro de upstream.
    throw new VertexError(0, err instanceof Error ? err.message : 'network error')
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new VertexError(res.status, `Vertex respondeu ${res.status}: ${body.slice(0, 300)}`)
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[]
    promptFeedback?: { blockReason?: string }
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
  }
  if (data.promptFeedback?.blockReason) {
    throw new VertexBlockedError(`entrada: ${data.promptFeedback.blockReason}`)
  }
  const candidate = data.candidates?.[0]
  if (candidate?.finishReason && BLOCKED_FINISH_REASONS.has(candidate.finishReason)) {
    throw new VertexBlockedError(`saída: ${candidate.finishReason}`)
  }
  // Partes `thought` são o resumo do raciocínio do modelo, não a resposta.
  const content = (candidate?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
  const text = sanitizeCompletion(content)
  if (!text) {
    throw new VertexError(
      0,
      `resposta do Vertex sem conteúdo utilizável (finishReason=${candidate?.finishReason ?? 'n/d'})`,
    )
  }
  return {
    text,
    usage: {
      inputTokens: data.usageMetadata?.promptTokenCount,
      outputTokens: data.usageMetadata?.candidatesTokenCount,
    },
  }
}
