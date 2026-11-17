import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TERMS_VERSION } from '../../src/data/terms/version.js'
import { createApp } from '../../server/src/app.js'
import { registerRoutes } from '../../server/src/routes.js'
import { bearer } from './token.js'

// Aceite dos termos de uso: um por usuário (sub do AMEI) e versão. O repo é
// trocado por um Map — o que se testa é a regra (quem, qual versão, idempotência).

vi.mock('../../server/src/config.js', async () => {
  const { keycloakTestConfig } = await import('./token.js')
  return {
    config: {
      mongoUri: 'mongodb://teste',
      mongoDb: 'teste',
      port: 0,
      host: '127.0.0.1',
      aiLimits: { perMinute: 10, perIpPerDay: 150, globalPerDay: 3000 },
      keycloak: keycloakTestConfig,
    },
  }
})

const gravados = new Map<string, Date>()
const chave = (sub: string, version: string) => `${sub}|${version}`

vi.mock('../../server/src/termos/repo.js', () => ({
  hasAccepted: async (sub: string, version: string) => gravados.has(chave(sub, version)),
  recordAcceptance: async (sub: string, version: string) => {
    if (!gravados.has(chave(sub, version))) gravados.set(chave(sub, version), new Date())
  },
  ensureTermsIndex: async () => {},
}))

// Mesmos stubs de auth.test.ts: o routes.ts importa todos os repos.
vi.mock('../../server/src/infra/db.js', () => ({ getDb: () => ({}) }))
vi.mock('../../server/src/municipios/repo.js', () => ({
  listMunicipalities: async () => [],
  getMunicipality: async () => null,
  getValuesForMunicipality: async () => [],
  getAllValues: async () => [],
}))
vi.mock('../../server/src/emendas/repo.js', () => ({ listEmendas: async () => [] }))
vi.mock('../../server/src/estado/repo.js', () => ({ listStateValues: async () => [] }))
vi.mock('../../server/src/indicadores/catalog-cache.js', () => ({ getCatalog: async () => ({}) }))

async function appWithRoutes() {
  const app = createApp(false)
  await registerRoutes(app)
  return app
}

const como = (sub: string) => bearer({ claims: { sub } })

describe('API · aceite dos termos de uso', () => {
  beforeEach(() => gravados.clear())

  it('sem token volta 401 (GET e POST)', async () => {
    const app = await appWithRoutes()
    const get = await app.inject({ method: 'GET', url: '/api/terms/acceptance' })
    const post = await app.inject({ method: 'POST', url: '/api/terms/acceptance', payload: { version: TERMS_VERSION } })
    expect([get.statusCode, post.statusCode]).toEqual([401, 401])
  })

  it('quem nunca aceitou: accepted=false e a versão vigente', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({ method: 'GET', url: '/api/terms/acceptance', headers: como('u1') })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ version: TERMS_VERSION, accepted: false })
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('aceitar a versão vigente grava e o GET passa a dizer accepted=true', async () => {
    const app = await appWithRoutes()
    const post = await app.inject({
      method: 'POST',
      url: '/api/terms/acceptance',
      headers: como('u1'),
      payload: { version: TERMS_VERSION },
    })
    expect(post.statusCode).toBe(200)
    expect(post.json()).toEqual({ version: TERMS_VERSION, accepted: true })
    const get = await app.inject({ method: 'GET', url: '/api/terms/acceptance', headers: como('u1') })
    expect(get.json()).toMatchObject({ accepted: true })
  })

  it('é idempotente: aceitar de novo mantém o primeiro aceite', async () => {
    const app = await appWithRoutes()
    const pedir = () =>
      app.inject({ method: 'POST', url: '/api/terms/acceptance', headers: como('u1'), payload: { version: TERMS_VERSION } })
    expect((await pedir()).statusCode).toBe(200)
    const primeira = gravados.get(chave('u1', TERMS_VERSION))
    expect((await pedir()).statusCode).toBe(200)
    expect(gravados.size).toBe(1)
    expect(gravados.get(chave('u1', TERMS_VERSION))).toBe(primeira)
  })

  it('versão que não é a vigente volta 400 e não grava nada', async () => {
    const app = await appWithRoutes()
    for (const version of ['2020-01-01', '', 1, null, undefined]) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/terms/acceptance',
        headers: como('u1'),
        payload: { version } as object,
      })
      expect(res.statusCode).toBe(400)
    }
    expect(gravados.size).toBe(0)
  })

  it('o aceite de um usuário não vale para outro', async () => {
    const app = await appWithRoutes()
    await app.inject({
      method: 'POST',
      url: '/api/terms/acceptance',
      headers: como('u1'),
      payload: { version: TERMS_VERSION },
    })
    const res = await app.inject({ method: 'GET', url: '/api/terms/acceptance', headers: como('u2') })
    expect(res.json()).toMatchObject({ accepted: false })
  })

  it('aceite de uma versão antiga não vale para a vigente', async () => {
    const app = await appWithRoutes()
    gravados.set(chave('u1', '2020-01-01'), new Date())
    const res = await app.inject({ method: 'GET', url: '/api/terms/acceptance', headers: como('u1') })
    expect(res.json()).toMatchObject({ accepted: false })
  })

  it('corpo ausente volta 400, não 500', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({ method: 'POST', url: '/api/terms/acceptance', headers: como('u1') })
    expect(res.statusCode).toBe(400)
  })
})
