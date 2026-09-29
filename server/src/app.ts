import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'

// Separado do index.ts, que sobe o servidor ao ser importado: aqui se monta a
// instância sem porta nem banco, e é assim que os testes a alcançam.

const DEFAULT_LOGGER: FastifyServerOptions['logger'] = {
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
}

function statusOf(err: unknown): number {
  if (typeof err === 'object' && err !== null && 'statusCode' in err) {
    const { statusCode } = err
    if (typeof statusCode === 'number') return statusCode
  }
  return 500
}

export function createApp(logger: FastifyServerOptions['logger'] = DEFAULT_LOGGER): FastifyInstance {
  const app = Fastify({ logger })

  // O handler padrão do Fastify devolve `err.message` também nos 5xx — e a
  // mensagem de uma falha do driver traz host e porta do MongoDB interno
  // (`connect ECONNREFUSED 10.1.141.23:27017`). Corpo de erro chega ao
  // navegador; o detalhe vai para o log (journalctl -u opp-api), onde quem
  // mantém precisa dele. 4xx segue o padrão: é erro de quem pediu, sem bastidor.
  app.setErrorHandler((err, req, reply) => {
    const status = statusOf(err)
    if (status < 500) return reply.send(err)
    req.log.error(err)
    return reply.code(status).send({ error: 'Erro interno.' })
  })

  return app
}
