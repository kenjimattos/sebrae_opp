import net from 'node:net'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../server/src/app.js'
import { createAuthGuard } from '../../server/src/auth/keycloak.js'
import { bearer } from './token.js'

// O keycloak-connect busca o JWKS no AMEI sem timeout. Se a máquina da API não
// alcança o AMEI e a rede DESCARTA os pacotes, a requisição ficava pendurada por
// minutos e a tela do usuário em branco. Aqui o "AMEI" é um servidor TCP que aceita
// a conexão e nunca responde, e o token é assinado por uma chave que o servidor
// só conseguiria validar buscando o JWKS (sem `realmPublicKey`).

let hang: net.Server
let sockets: net.Socket[] = []
let porta = 0

beforeEach(async () => {
  sockets = []
  hang = net.createServer((s) => {
    sockets.push(s) // aceita e fica mudo
  })
  await new Promise<void>((ok) => hang.listen(0, '127.0.0.1', ok))
  porta = (hang.address() as net.AddressInfo).port
})

afterEach(async () => {
  for (const s of sockets) s.destroy()
  await new Promise<void>((ok) => hang.close(() => ok()))
})

async function appComGuard(url: string, timeoutMs: number) {
  const app = createApp(false)
  app.decorateRequest('user', null)
  app.addHook('preHandler', createAuthGuard({ url, realm: 'sebrae', clientId: 'pippa' }, { timeoutMs }))
  app.get('/x', async () => ({ ok: true }))
  return app
}

describe('guard de login · AMEI que não responde', () => {
  it('AMEI mudo: responde 503 no tempo do limite, em vez de pendurar', async () => {
    const url = `http://127.0.0.1:${porta}`
    const app = await appComGuard(url, 300)
    const t0 = Date.now()
    const res = await app.inject({
      method: 'GET',
      url: '/x',
      headers: bearer({ claims: { iss: `${url}/realms/sebrae` } }),
    })
    expect(res.statusCode).toBe(503)
    expect(Date.now() - t0).toBeLessThan(3000)
    // corpo genérico: nem o host do AMEI nem a palavra "timeout"
    expect(res.json()).toEqual({ error: 'Erro interno.' })
    expect(res.body).not.toMatch(/127\.0\.0\.1|amei|timeout|jwks/i)
  })

  it('AMEI recusando a conexão (porta fechada) volta 401 rápido, não 503', async () => {
    // Fecha a porta: a conexão é recusada na hora, o que o keycloak-connect trata como falha de validação.
    const fechada = porta
    for (const s of sockets) s.destroy()
    await new Promise<void>((ok) => hang.close(() => ok()))
    const url = `http://127.0.0.1:${fechada}`
    const app = await appComGuard(url, 5000)
    const t0 = Date.now()
    const res = await app.inject({
      method: 'GET',
      url: '/x',
      headers: bearer({ claims: { iss: `${url}/realms/sebrae` } }),
    })
    expect(res.statusCode).toBe(401)
    expect(Date.now() - t0).toBeLessThan(3000)
    // o afterEach fecha de novo um servidor já fechado: recria para ele não falhar
    hang = net.createServer()
    await new Promise<void>((ok) => hang.listen(0, '127.0.0.1', ok))
  })

  it('sem token não depende do AMEI: 401 imediato mesmo com o AMEI mudo', async () => {
    const app = await appComGuard(`http://127.0.0.1:${porta}`, 5000)
    const t0 = Date.now()
    const res = await app.inject({ method: 'GET', url: '/x' })
    expect(res.statusCode).toBe(401)
    expect(Date.now() - t0).toBeLessThan(1000)
  })
})
