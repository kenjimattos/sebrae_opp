import Fastify from 'fastify'
import { config } from './config.js'
import { connectDb, closeDb } from './db.js'
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
