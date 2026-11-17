import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// O módulo real lê as VITE_KEYCLOAK_* e criaria um Keycloak de verdade.
const keycloak = {
  token: 'tok-1' as string | undefined,
  updateToken: vi.fn(async (_minValidity?: number) => true),
  login: vi.fn(async () => {}),
}
vi.mock('@/auth/keycloak', () => ({ getKeycloak: () => keycloak }))

import { authFetch } from '@/data/http'

function resposta(status: number) {
  return new Response('{}', { status })
}

describe('authFetch', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    keycloak.token = 'tok-1'
    keycloak.updateToken.mockReset().mockResolvedValue(true)
    keycloak.login.mockReset()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  const bearerEnviado = (chamada: number) =>
    new Headers((fetchMock.mock.calls[chamada]?.[1] as RequestInit).headers).get('Authorization')

  it('manda o token em Authorization: Bearer e preserva o resto do pedido', async () => {
    fetchMock.mockResolvedValue(resposta(200))
    await authFetch('/api/estado', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    expect(bearerEnviado(0)).toBe('Bearer tok-1')
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
  })

  it('renova o token se faltar menos de 30s para expirar', async () => {
    fetchMock.mockResolvedValue(resposta(200))
    await authFetch('/api/estado')
    expect(keycloak.updateToken).toHaveBeenCalledWith(30)
  })

  it('401: força UMA renovação, tenta de novo com o token novo e devolve o resultado', async () => {
    fetchMock.mockResolvedValueOnce(resposta(401)).mockResolvedValueOnce(resposta(200))
    keycloak.updateToken.mockImplementation(async (min?: number) => {
      if (min === -1) keycloak.token = 'tok-2'
      return true
    })
    const res = await authFetch('/api/estado')
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(bearerEnviado(1)).toBe('Bearer tok-2')
  })

  it('401 persistente sobe como 401 e NÃO volta ao AMEI (evita laço de redirecionamento)', async () => {
    fetchMock.mockResolvedValue(resposta(401))
    const res = await authFetch('/api/estado')
    expect(res.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(keycloak.login).not.toHaveBeenCalled()
  })

  it('renovação que falha (sessão vencida) volta ao AMEI e não chama a API', async () => {
    keycloak.updateToken.mockRejectedValue(new Error('refresh vencido'))
    await expect(authFetch('/api/estado')).rejects.toThrow('Sessão expirada')
    expect(keycloak.login).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
