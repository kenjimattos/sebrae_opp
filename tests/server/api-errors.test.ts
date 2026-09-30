import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../../server/src/app.js'
import { registerRoutes } from '../../server/src/routes.js'

// Corpo de erro chega ao navegador. A falha real do driver traz host e porta do
// MongoDB interno; nada disso pode sair na resposta.
const FALHA_DO_DRIVER = 'connect ECONNREFUSED 10.1.141.23:27017'
const BASTIDOR = /10\.1\.|27017|ECONNREFUSED|mongo|seed|cole[cç][aã]o|database\//i

// O config real exige MONGO_URI ao ser importado.
vi.mock('../../server/src/config.js', () => ({
  config: { mongoUri: 'mongodb://teste', mongoDb: 'teste', port: 0, host: '127.0.0.1' },
}))

vi.mock('../../server/src/infra/db.js', () => ({
  getDb: () => {
    throw new Error(FALHA_DO_DRIVER)
  },
}))

vi.mock('../../server/src/municipios/repo.js', () => ({
  listMunicipalities: async () => [],
  getMunicipality: async () => null,
  getValuesForMunicipality: async () => [],
  getAllValues: async () => [],
}))

vi.mock('../../server/src/emendas/repo.js', () => ({
  listEmendas: async () => [],
}))

vi.mock('../../server/src/estado/repo.js', () => ({
  listStateValues: async () => [],
}))

// Sem isto, /api/estado explodiria no getDb do catálogo (500) antes de chegar à
// checagem de coleção vazia, e o 503 abaixo nunca seria exercitado.
vi.mock('../../server/src/indicadores/catalog-cache.js', () => ({
  getCatalog: async () => ({
    agendas: [],
    indicatorsByAgenda: new Map(),
    socialeconomic: [],
    estadual: [],
    byId: new Map(),
  }),
}))

async function appWithRoutes() {
  const app = createApp(false)
  await registerRoutes(app)
  return app
}

describe('API · erro sem bastidor', () => {
  it('5xx responde genérico, sem host nem porta do banco', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(500)
    expect(res.json()).toEqual({ error: 'Erro interno.' })
    expect(res.body).not.toMatch(BASTIDOR)
  })

  it('503 de emendas não nomeia coleção nem caminho dos seeds', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({ method: 'GET', url: '/api/emendas' })
    expect(res.statusCode).toBe(503)
    expect(res.body).not.toMatch(BASTIDOR)
  })

  it('503 estadual não nomeia coleção nem caminho dos seeds', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({ method: 'GET', url: '/api/estado' })
    expect(res.statusCode).toBe(503)
    expect(res.json()).toEqual({ error: 'Dados estaduais indisponíveis.' })
    // o recado com o nome da coleção e o caminho dos seeds vai para o LOG
    expect(res.body).not.toMatch(BASTIDOR)
  })

  it('4xx segue com a mensagem — é erro de quem pediu', async () => {
    const app = await appWithRoutes()
    const res = await app.inject({ method: 'GET', url: '/api/municipalities/9999999' })
    expect(res.statusCode).toBe(404)
  })
})
