import type { FastifyInstance } from 'fastify'
import { handleAiTask } from '../../api/_lib/handler.js'
import { config } from './config.js'
import { getDb } from './db.js'
import { getCatalog } from './catalog-cache.js'
import {
  getAllValues,
  getMunicipality,
  getValuesForMunicipality,
  listEmendas,
  listMunicipalities,
} from './repo.js'
import { buildEmendasData, buildIndicatorsData, buildMapData } from './services.js'
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

  // Emendas parlamentares por município (modo "Mapeamento de recursos"). Devolve
  // as duas esferas de uma vez: o modo colore o mapa com o estado inteiro e o
  // toggle federal/estadual não deve disparar nova requisição.
  app.get('/api/emendas', async (_req, reply) => {
    const [municipalities, emendas] = await Promise.all([
      listMunicipalities(),
      listEmendas(),
    ])
    if (emendas.length === 0) {
      // Coleção vazia = seeds de emendas ainda não rodaram neste banco. É um erro
      // de operação, não uma resposta válida: devolver um payload vazio faria a UI
      // mostrar "R$ 0" para os 223 municípios como se fosse dado real.
      return reply.code(503).send({
        error: 'Coleção `emendas` vazia — rode os seeds database/seed/emendas-*.mongodb.js',
      })
    }
    return buildEmendasData(municipalities, emendas)
  })

  // Terceiro transporte do mesmo núcleo de IA (api/_lib/handler.ts), ao lado da
  // function da Vercel e do middleware de dev do Vite — é o que atende as
  // superfícies de IA em produção Sebrae, onde o Nginx manda todo /api/* para cá.
  // Sem OPENROUTER_API_KEY o handler devolve `missing_key` (500) e o frontend
  // mostra "O serviço de IA não está configurado neste ambiente".
  app.post('/api/ai', async (req, reply) => {
    const { status, body } = await handleAiTask(req.body, {
      apiKey: config.openrouterApiKey,
      model: config.openrouterModel,
    })
    return reply.code(status).send(body)
  })
}
