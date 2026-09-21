import compress from '@fastify/compress'
import Fastify from 'fastify'
import { config } from './config.js'
import { connectDb, closeDb } from './infra/db.js'
import { registerRoutes } from './routes.js'

const app = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV === 'production'
        ? undefined
        : { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
  },
})

async function start() {
  try {
    await connectDb()
    app.log.info(`conectado ao MongoDB (${config.mongoDb})`)
    // Gzip/brotli nas respostas. As rotas daqui são JSON repetitivo (223 nomes de
    // município, o mesmo shape de indicador 33 vezes), o formato que mais encolhe.
    // Abaixo do threshold o overhead de comprimir não se paga — e o Nginx na frente
    // repassa a resposta já comprimida, não comprime de novo.
    await app.register(compress, { threshold: 1024 })
    await registerRoutes(app)
    await app.listen({ port: config.port, host: config.host })
  } catch (err) {
    app.log.error(err)
    await closeDb()
    process.exit(1)
  }
}

// Encerra conexões de forma limpa no shutdown (systemd envia SIGTERM).
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    app.log.info(`${signal} recebido — encerrando`)
    await app.close()
    await closeDb()
    process.exit(0)
  })
}

start()
