import { generateKeyPairSync } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callVertex, vertexEnvFrom, VertexError } from '../../api/_lib/vertex.js'
import type { VertexEnv } from '../../api/_lib/vertex.js'

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
})

const serviceAccount = {
  client_email: 'pippa@meu-projeto.iam.gserviceaccount.com',
  private_key: privateKey,
  project_id: 'meu-projeto',
}

describe('vertexEnvFrom', () => {
  it('sem a variável, devolve undefined (o handler responde unavailable)', () => {
    expect(vertexEnvFrom({})).toBeUndefined()
  })

  it('lê o JSON da service account e aplica os defaults de modelo e região', () => {
    const env = vertexEnvFrom({ GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify(serviceAccount) })
    expect(env?.credentials.projectId).toBe('meu-projeto')
    expect(env?.credentials.clientEmail).toBe(serviceAccount.client_email)
    expect(env?.model).toBe('gemini-3.8-flash')
    expect(env?.location).toBe('global')
  })

  it('VERTEX_MODEL e VERTEX_LOCATION sobrescrevem os defaults', () => {
    const env = vertexEnvFrom({
      GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify(serviceAccount),
      VERTEX_MODEL: 'gemini-2.5-pro',
      VERTEX_LOCATION: 'southamerica-east1',
    })
    expect(env?.model).toBe('gemini-2.5-pro')
    expect(env?.location).toBe('southamerica-east1')
  })

  it('JSON inválido ou incompleto não derruba: devolve undefined', () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(vertexEnvFrom({ GOOGLE_SERVICE_ACCOUNT_JSON: '{nao é json' })).toBeUndefined()
    expect(
      vertexEnvFrom({ GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: 'a@b' }) }),
    ).toBeUndefined()
    erro.mockRestore()
  })

  it('o log de config inválida não vaza a chave privada', () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    vertexEnvFrom({ GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ private_key: privateKey }) })
    expect(JSON.stringify(erro.mock.calls)).not.toContain('PRIVATE KEY')
    erro.mockRestore()
  })
})

describe('callVertex', () => {
  const env: VertexEnv = {
    credentials: {
      clientEmail: serviceAccount.client_email,
      privateKey,
      projectId: serviceAccount.project_id,
    },
    model: 'gemini-2.5-flash',
    location: 'us-central1',
  }
  const fetchMock = vi.fn()

  const tokenOk = () =>
    new Response(JSON.stringify({ access_token: 'tok-1', expires_in: 3600 }), { status: 200 })
  const geminiOk = (parts: unknown[]) =>
    new Response(JSON.stringify({ candidates: [{ content: { parts } }] }), { status: 200 })

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('troca o JWT por token e chama o generateContent com system separado', async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(geminiOk([{ text: 'Olá.' }]))

    const texto = await callVertex(
      [
        { role: 'system', content: 'Seja breve.' },
        { role: 'user', content: 'Oi' },
        { role: 'assistant', content: 'Olá' },
        { role: 'user', content: 'E então?' },
      ],
      { ...env, credentials: { ...env.credentials, clientEmail: 'unico-1@x.iam' } },
    )
    expect(texto).toBe('Olá.')

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0]
    expect(tokenUrl).toBe('https://oauth2.googleapis.com/token')
    const form = new URLSearchParams(String(tokenInit.body))
    expect(form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer')
    expect(form.get('assertion')?.split('.')).toHaveLength(3)

    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe(
      'https://us-central1-aiplatform.googleapis.com/v1/projects/meu-projeto' +
        '/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent',
    )
    expect(init.headers.Authorization).toBe('Bearer tok-1')
    const body = JSON.parse(init.body)
    expect(body.systemInstruction.parts[0].text).toBe('Seja breve.')
    expect(body.contents.map((c: { role: string }) => c.role)).toEqual(['user', 'model', 'user'])
  })

  it('região global usa o host sem prefixo', async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(geminiOk([{ text: 'ok' }]))
    await callVertex([{ role: 'user', content: 'x' }], {
      ...env,
      location: 'global',
      credentials: { ...env.credentials, clientEmail: 'unico-2@x.iam' },
    })
    expect(fetchMock.mock.calls[1][0]).toMatch(/^https:\/\/aiplatform\.googleapis\.com\//)
  })

  it('reaproveita o token em chamadas seguidas', async () => {
    const creds = { ...env.credentials, clientEmail: 'unico-3@x.iam' }
    fetchMock
      .mockResolvedValueOnce(tokenOk())
      .mockResolvedValueOnce(geminiOk([{ text: 'um' }]))
      .mockResolvedValueOnce(geminiOk([{ text: 'dois' }]))
    await callVertex([{ role: 'user', content: 'a' }], { ...env, credentials: creds })
    await callVertex([{ role: 'user', content: 'b' }], { ...env, credentials: creds })
    expect(fetchMock).toHaveBeenCalledTimes(3) // 1 token + 2 gerações
  })

  it('descarta partes de raciocínio (thought) da resposta', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk())
      .mockResolvedValueOnce(
        geminiOk([{ text: 'Pensando...', thought: true }, { text: 'Resposta final.' }]),
      )
    const texto = await callVertex([{ role: 'user', content: 'x' }], {
      ...env,
      credentials: { ...env.credentials, clientEmail: 'unico-4@x.iam' },
    })
    expect(texto).toBe('Resposta final.')
  })

  it('resposta sem texto vira erro, não balão em branco', async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(geminiOk([]))
    await expect(
      callVertex([{ role: 'user', content: 'x' }], {
        ...env,
        credentials: { ...env.credentials, clientEmail: 'unico-5@x.iam' },
      }),
    ).rejects.toBeInstanceOf(VertexError)
  })

  it('429 do upstream preserva o status (o handler devolve rate_limited)', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk())
      .mockResolvedValueOnce(new Response('quota', { status: 429 }))
    await expect(
      callVertex([{ role: 'user', content: 'x' }], {
        ...env,
        credentials: { ...env.credentials, clientEmail: 'unico-6@x.iam' },
      }),
    ).rejects.toMatchObject({ status: 429 })
  })

  it('chave privada malformada vira VertexError, sem chamar a rede', async () => {
    await expect(
      callVertex([{ role: 'user', content: 'x' }], {
        ...env,
        credentials: { ...env.credentials, clientEmail: 'unico-7@x.iam', privateKey: 'lixo' },
      }),
    ).rejects.toBeInstanceOf(VertexError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
