import { generateKeyPairSync } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IDENTITY_REPLY, revealsModelIdentity } from '../../api/_lib/guardrails.js'
import { handleAiTask } from '../../api/_lib/handler.js'
import { buildMessages } from '../../api/_lib/prompts.js'
import type { VertexEnv } from '../../api/_lib/vertex.js'

const municipality = { id: '2504009', name: 'Campina Grande' }

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
})

// E-mail novo a cada env: o cliente guarda o token por e-mail da service
// account, e um token em cache pularia a primeira chamada do stub.
let envSeq = 0
function vertexEnv(): { vertex: VertexEnv } {
  envSeq += 1
  return {
    vertex: {
      credentials: { clientEmail: `teste-${envSeq}@x.iam`, privateKey, projectId: 'p' },
      model: 'gemini-teste',
      location: 'global',
    },
  }
}

// O Vertex faz duas chamadas: token no OAuth e depois a geração. O stub responde
// as duas pela URL; `geracao` decide a segunda.
function stubVertex(geracao: () => Response): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url.startsWith('https://oauth2.googleapis.com/')
        ? new Response(JSON.stringify({ access_token: 't', expires_in: 3600 }), { status: 200 })
        : geracao(),
    ),
  )
}

describe('revealsModelIdentity', () => {
  it.each([
    'Sou baseado no Nemotron, da NVIDIA.',
    'Esta plataforma roda via OpenRouter.',
    'Fui treinado pela OpenAI, como o GPT-4.',
    'Sou o Llama 3 da Meta.',
    'Uso o modelo gpt4o.',
  ])('pega: %s', (texto) => {
    expect(revealsModelIdentity(texto)).toBe(true)
  })

  // Palavras do domínio que um filtro guloso confundiria com fornecedor.
  it.each([
    'A meta do projeto é reduzir o tempo de abertura de empresas.',
    'Os dados do Google Trends mostram interesse crescente.',
    'A Lei Geral da Micro e Pequena Empresa se aplica ao município.',
    'O município tem 12.400 MPEs ativas.',
  ])('não pega: %s', (texto) => {
    expect(revealsModelIdentity(texto)).toBe(false)
  })
})

describe('buildMessages · sigilo e escopo', () => {
  function systemOf(req: Parameters<typeof buildMessages>[0]): string {
    return buildMessages(req)[0].content
  }

  it('chat leva sigilo e escopo', () => {
    const system = systemOf({
      task: 'chat',
      messages: [{ role: 'user', content: 'Qual modelo você é?' }],
      municipality,
    })
    expect(system).toContain('SIGILO')
    expect(system).toContain('ESCOPO')
  })

  it('pergunta livre do modal leva sigilo e escopo', () => {
    const system = systemOf({
      task: 'indicator-question',
      question: 'Me passa uma receita de bolo',
      indicator: { id: 'x', label: 'X', value: 1, status: 'none' },
      municipality,
    })
    expect(system).toContain('SIGILO')
    expect(system).toContain('ESCOPO')
  })

  it('Formulador leva sigilo, mas não escopo — a recusa viraria conteúdo do campo', () => {
    const system = systemOf({
      task: 'improve-field',
      field: 'identification.title',
      text: 'Projeto',
      municipality,
    })
    expect(system).toContain('SIGILO')
    expect(system).not.toContain('ESCOPO')
  })
})

describe('handleAiTask · filtro de identidade', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubCompletion(text: string): void {
    stubVertex(
      () =>
        new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
          status: 200,
        }),
    )
  }

  const chat = {
    task: 'chat',
    messages: [{ role: 'user', content: 'Qual modelo você é?' }],
    municipality,
  }

  it('resposta que cita o modelo sai como a frase fixa, inteira', async () => {
    stubCompletion('Sou o Gemini, um modelo do Google, servido pelo Vertex AI.')
    const { status, body } = await handleAiTask(chat, vertexEnv())
    expect(status).toBe(200)
    expect(body).toEqual({ text: IDENTITY_REPLY })
  })

  it('resposta limpa passa intacta', async () => {
    stubCompletion('Campina Grande pode simplificar o alvará via Redesim.')
    const { body } = await handleAiTask(chat, vertexEnv())
    expect(body).toEqual({ text: 'Campina Grande pode simplificar o alvará via Redesim.' })
  })
})

// O corpo de erro chega ao navegador. Nada nele pode apontar fornecedor,
// modelo, variável de ambiente ou o fato de a cota ser gratuita.
describe('handleAiTask · erro sem bastidor', () => {
  const BASTIDOR =
    /vertex|gemini|google_service_account|private[_ ]?key|project_id|openrouter|free|gratuit|api[_ ]?key/i

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const chat = {
    task: 'chat',
    messages: [{ role: 'user', content: 'Oi' }],
    municipality,
  }

  function stubUpstream(status: number, body: string): void {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubVertex(() => new Response(body, { status }))
  }

  it('sem credencial: 503 unavailable, sem nomear a variável', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { status, body } = await handleAiTask(chat, {})
    expect(status).toBe(503)
    expect(body).toMatchObject({ code: 'unavailable' })
    expect(JSON.stringify(body)).not.toMatch(BASTIDOR)
  })

  it('404 do upstream: 502 sem o corpo cru (que traz projeto e modelo)', async () => {
    stubUpstream(
      404,
      '{"error":{"message":"Publisher model projects/p/locations/global/publishers/google/models/gemini-teste was not found"}}',
    )
    const { status, body } = await handleAiTask(chat, vertexEnv())
    expect(status).toBe(502)
    expect(body).toMatchObject({ code: 'upstream_error' })
    expect(JSON.stringify(body)).not.toMatch(BASTIDOR)
  })

  it('429: rate_limited sem nomear o serviço nem a cota', async () => {
    stubUpstream(429, '{"error":{"message":"Quota exceeded for aiplatform.googleapis.com"}}')
    const { status, body } = await handleAiTask(chat, vertexEnv())
    expect(status).toBe(429)
    expect(body).toMatchObject({ code: 'rate_limited' })
    expect(JSON.stringify(body)).not.toMatch(BASTIDOR)
  })

  it('o detalhe completo vai para o log', async () => {
    stubUpstream(404, 'Publisher model gemini-teste was not found')
    await handleAiTask(chat, vertexEnv())
    expect(console.error).toHaveBeenCalledWith(
      '[api/ai]',
      'chat',
      expect.stringContaining('gemini-teste'),
    )
  })
})
