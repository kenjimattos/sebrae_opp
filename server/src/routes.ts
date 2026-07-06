import type { FastifyInstance } from 'fastify'
import { getDb } from './db.js'
import { getCatalog } from './catalog-cache.js'
import {
  getAllValues,
  getMunicipality,
  getValuesForMunicipality,
  listMunicipalities,
} from './repo.js'
import { buildIndicatorsData, buildMapData } from './services.js'
import type { MunicipalitySummary } from './types.js'

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Health check — usado pelo Nginx/monitoramento e para validar a conexão.
  app.get('/api/health', async () => {
    await getDb().command({ ping: 1 })
    return { ok: true, db: 'up' }
  })

  // Lista de municípios para o seletor.
  app.get('/api/municipalities', async () => {
    const docs = await listMunicipalities()
    const list: MunicipalitySummary[] = docs.map((m) => ({
      id: m._id,
      name: m.name,
      slug: m.slug,
    }))
    return list
  })

  // Dados completos de um município (agendas + base econômica, status calculado).
  app.get<{ Params: { id: string } }>('/api/municipalities/:id', async (req, reply) => {
    const { id } = req.params
    const municipality = await getMunicipality(id)
    if (!municipality) {
      return reply.code(404).send({ error: 'Município não encontrado', id })
    }
    const [catalog, values] = await Promise.all([
      getCatalog(),
      getValuesForMunicipality(id),
    ])
    return buildIndicatorsData(municipality, catalog, values)
  })

  // Dados do mapa: valores por município para colorir + opções do dropdown.
  app.get('/api/map', async () => {
    const [catalog, municipalities, allValues] = await Promise.all([
      getCatalog(),
      listMunicipalities(),
      getAllValues(),
    ])
    return buildMapData(catalog, municipalities, allValues)
  })
}
