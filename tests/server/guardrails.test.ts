import { afterEach, describe, expect, it, vi } from 'vitest'
import { IDENTITY_REPLY, revealsModelIdentity } from '../../api/_lib/guardrails.js'
import { handleAiTask } from '../../api/_lib/handler.js'
import { buildMessages } from '../../api/_lib/prompts.js'

const municipality = { id: '2504009', name: 'Campina Grande' }

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

  function stubCompletion(content: string): void {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 }),
      ),
    )
  }

  const chat = {
    task: 'chat',
    messages: [{ role: 'user', content: 'Qual modelo você é?' }],
    municipality,
  }

  it('resposta que cita o modelo sai como a frase fixa, inteira', async () => {
    stubCompletion('Sou o Nemotron 3 Super, da NVIDIA, servido via OpenRouter.')
    const { status, body } = await handleAiTask(chat, { apiKey: 'k' })
    expect(status).toBe(200)
    expect(body).toEqual({ text: IDENTITY_REPLY })
  })

  it('resposta limpa passa intacta', async () => {
    stubCompletion('Campina Grande pode simplificar o alvará via Redesim.')
    const { body } = await handleAiTask(chat, { apiKey: 'k' })
    expect(body).toEqual({ text: 'Campina Grande pode simplificar o alvará via Redesim.' })
  })
})
