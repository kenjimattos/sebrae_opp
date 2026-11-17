import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../../server/src/app.js'
import { DailyQuota } from '../../server/src/ia/quota.js'
import { registerRoutes } from '../../server/src/routes.js'
import { bearer } from './token.js'

// Login AMEI: toda rota de /api exige um access_token válido, exceto o health.
// A API só devolve 401 com corpo genérico — o motivo real vai para o log.

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

vi.mock('../../server/src/infra/db.js', () => ({
  getDb: () => ({ command: async () => ({ ok: 1 }) }),
}))

vi.mock('../../server/src/municipios/repo.js', () => ({
  listMunicipalities: async () => [{ _id: '2504009', name: 'Campina Grande', slug: 'campina-grande' }],
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

const ROTAS_PROTEGIDAS = [
  { method: 'GET', url: '/api/municipalities' },
  { method: 'GET', url: '/api/municipalities/2504009' },
  { method: 'GET', url: '/api/map' },
  { method: 'GET', url: '/api/emendas' },
  { method: 'GET', url: '/api/estado' },
  { method: 'POST', url: '/api/ai' },
] as const

describe('API · login AMEI', () => {
  it('o health é público (monitoramento não tem token)', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
  })

  it.each(ROTAS_PROTEGIDAS)('$method $url sem token volta 401', async ({ method, url }) => {
    const app = await appWithRoutes()
    const res = await app.inject({ method, url, payload: method === 'POST' ? {} : undefined })
    expect(res.statusCode).toBe(401)
    expect(res.headers['www-authenticate']).toBe('Bearer')
  })

  it('token válido passa', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({ method: 'GET', url: '/api/municipalities', headers: bearer() })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual([{ id: '2504009', name: 'Campina Grande', slug: 'campina-grande' }])
    // dado por usuário não pode ficar em cache compartilhado
    expect(res.headers['cache-control']).toMatch(/^private/)
  })

  it('token expirado volta 401', async () => {
    const app = await appWithRoutes()
    const passado = Math.floor(Date.now() / 1000) - 60
    const res = await app.inject({
      method: 'GET',
      url: '/api/municipalities',
      headers: bearer({ claims: { exp: passado, iat: passado - 300 } }),
    })
    expect(res.statusCode).toBe(401)
  })

  it('assinatura de outra chave volta 401', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({
      method: 'GET',
      url: '/api/municipalities',
      headers: bearer({ chaveErrada: true }),
    })
    expect(res.statusCode).toBe(401)
  })

  it('issuer de outro realm volta 401', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({
      method: 'GET',
      url: '/api/municipalities',
      headers: bearer({ claims: { iss: 'https://amei.teste/auth/realms/outro' } }),
    })
    expect(res.statusCode).toBe(401)
  })

  it('token emitido para o client de OUTRA plataforma do Sebrae volta 401', async () => {
    // Mesmo realm, assinatura e issuer válidos — só o `azp` difere.
    const app = await appWithRoutes()
    const res = await app.inject({
      method: 'GET',
      url: '/api/municipalities',
      headers: bearer({ claims: { azp: 'outro-sistema' } }),
    })
    expect(res.statusCode).toBe(401)
  })

  it('token sem sub volta 401', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({
      method: 'GET',
      url: '/api/municipalities',
      headers: bearer({ claims: { sub: undefined } }),
    })
    expect(res.statusCode).toBe(401)
  })

  it('cabeçalho que não é Bearer volta 401', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({
      method: 'GET',
      url: '/api/municipalities',
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('o 401 não conta o motivo: corpo genérico, sem bastidor', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({
      method: 'GET',
      url: '/api/municipalities',
      headers: bearer({ chaveErrada: true }),
    })
    expect(res.json()).toMatchObject({ message: 'Acesso não autorizado.' })
    expect(res.body).not.toMatch(/signature|expired|ISS|realm|amei|keycloak|azp/i)
  })

  it('/api/ai sem token não gasta a cota diária', async () => {
    const take = vi.spyOn(DailyQuota.prototype, 'take')
    const app = await appWithRoutes()
    const res = await app.inject({ method: 'POST', url: '/api/ai', payload: {} })
    expect(res.statusCode).toBe(401)
    expect(take).not.toHaveBeenCalled()
    take.mockRestore()
  })
})
