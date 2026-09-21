import type { FastifyInstance } from 'fastify'
import { handleAiTask } from '../../api/_lib/handler.js'
import { config } from './config.js'
import { getDb } from './db.js'
import { getCatalog } from './catalog-cache.js'
import { CACHE_SECONDS, cachedPayload } from './payload-cache.js'
import {
  getAllValues,
  getMunicipality,
  getValuesForMunicipality,
  listEmendas,
  listMunicipalities,
} from './repo.js'
import { buildEmendasData, buildIndicatorsData, buildMapData } from './services.js'
import type { MunicipalitySummary } from './types.js'

// `Cache-Control` das rotas de leitura. Os dados vêm de uma carga do ETL, não de
// escrita de usuário — a API é só leitura —, então revalidar a cada clique só
// gasta viagem. `public` porque a resposta é a mesma para todo mundo: não há
// sessão nem dado por usuário em rota nenhuma daqui.
const READ_CACHE = `public, max-age=${CACHE_SECONDS}`

// Ver o uso em /api/emendas: sinaliza coleção vazia de dentro do cache.
class EmptyEmendasError extends Error {}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Health check — usado pelo Nginx/monitoramento e para validar a conexão.
  // `no-store` de propósito: health cacheado responde "up" com o banco caído.
  app.get('/api/health', async (_req, reply) => {
    await getDb().command({ ping: 1 })
    reply.header('cache-control', 'no-store')
    return { ok: true, db: 'up' }
  })

  // Lista de municípios para o seletor.
  app.get('/api/municipalities', async (_req, reply) => {
    const list = await cachedPayload('municipalities', async () => {
      const docs = await listMunicipalities()
      return docs.map<MunicipalitySummary>((m) => ({
        id: m._id,
        name: m.name,
        slug: m.slug,
      }))
    })
    reply.header('cache-control', READ_CACHE)
    return list
  })

  // Dados completos de um município (agendas + base econômica, status calculado).
  // Cacheado por município: são 223 chaves no pior caso, cada uma um JSON pequeno.
  app.get<{ Params: { id: string } }>('/api/municipalities/:id', async (req, reply) => {
    const { id } = req.params
    const data = await cachedPayload(`municipality:${id}`, async () => {
      const municipality = await getMunicipality(id)
      if (!municipality) return null
      const [catalog, values] = await Promise.all([
        getCatalog(),
        getValuesForMunicipality(id),
      ])
      return buildIndicatorsData(municipality, catalog, values)
    })
    if (!data) {
      return reply.code(404).send({ error: 'Município não encontrado', id })
    }
    reply.header('cache-control', READ_CACHE)
    return data
  })

  // Dados do mapa: valores por município para colorir + opções do dropdown.
  // É a rota mais cara da API — lê `indicatorValues` inteira (todos os
  // municípios, todos os indicadores, toda a série) e remonta o JSON. O
  // resultado é idêntico para todos os visitantes, então montar uma vez por TTL
  // é a diferença entre uma varredura e uma por pessoa que abre a Home.
  app.get('/api/map', async (_req, reply) => {
    const data = await cachedPayload('map', async () => {
      const [catalog, municipalities, allValues] = await Promise.all([
        getCatalog(),
        listMunicipalities(),
        getAllValues(),
      ])
      return buildMapData(catalog, municipalities, allValues)
    })
    reply.header('cache-control', READ_CACHE)
    return data
  })

  // Emendas parlamentares por município (modo "Mapeamento de recursos"). Devolve
  // as duas esferas de uma vez: o modo colore o mapa com o estado inteiro e o
  // toggle federal/estadual não deve disparar nova requisição.
  app.get('/api/emendas', async (_req, reply) => {
    let data
    try {
      data = await cachedPayload('emendas', async () => {
        const [municipalities, emendas] = await Promise.all([
          listMunicipalities(),
          listEmendas(),
        ])
        // Coleção vazia = seeds de emendas ainda não rodaram neste banco. É um erro
        // de operação, não uma resposta válida: devolver um payload vazio faria a UI
        // mostrar "R$ 0" para os 223 municípios como se fosse dado real.
        //
        // Sai como exceção, não como valor, porque o cache guarda valor e descarta
        // erro: um `null` cacheado seguraria o 503 por todo o TTL depois de os
        // seeds rodarem — a coleção certa, a resposta errada, e ninguém olhando.
        if (emendas.length === 0) throw new EmptyEmendasError()
        return buildEmendasData(municipalities, emendas)
      })
    } catch (err) {
      if (!(err instanceof EmptyEmendasError)) throw err
      return reply.code(503).send({
        error: 'Coleção `emendas` vazia — rode os seeds database/seed/emendas-*.mongodb.js',
      })
    }
    reply.header('cache-control', READ_CACHE)
    return data
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
    // Sem cache: cada pergunta é uma pergunta, e a resposta do modelo não é
    // determinística nem compartilhável entre usuários.
    reply.header('cache-control', 'no-store')
    return reply.code(status).send(body)
  })
}
