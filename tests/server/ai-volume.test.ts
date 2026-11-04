import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../server/src/app.js'
import { DailyQuota } from '../../server/src/ia/quota.js'
import { registerRoutes } from '../../server/src/routes.js'

// Travas de volume do /api/ai: rajada por minuto (@fastify/rate-limit), cota
// diária por IP e global (DailyQuota), bodyLimit e a origem do IP (trustProxy).
// Sem `vertex` no config o handler responde 503 — o que basta para saber que o
// pedido passou das travas, sem simular o modelo.

// Limites baixos para o teste alcançar o teto em poucas chamadas.
vi.mock('../../server/src/config.js', () => ({
  config: {
    mongoUri: 'mongodb://teste',
    mongoDb: 'teste',
    port: 0,
    host: '127.0.0.1',
    aiLimits: { perMinute: 3, perIpPerDay: 5, globalPerDay: 8 },
  },
}))

const corpo = {
  task: 'chat',
  messages: [{ role: 'user', content: 'Oi' }],
  municipality: { id: '2504009', name: 'Campina Grande' },
}

describe('DailyQuota', () => {
  it('recusa o IP no teto dele e os outros seguem', () => {
    const q = new DailyQuota({ perIpPerDay: 2, globalPerDay: 100 })
    expect([q.take('a'), q.take('a'), q.take('a')]).toEqual(['ok', 'ok', 'ip'])
    expect(q.take('b')).toBe('ok')
  })

  it('o teto global fecha para todo mundo', () => {
    const q = new DailyQuota({ perIpPerDay: 100, globalPerDay: 2 })
    expect([q.take('a'), q.take('b'), q.take('c')]).toEqual(['ok', 'ok', 'global'])
  })

  it('chamada recusada não conta no teto global', () => {
    const q = new DailyQuota({ perIpPerDay: 1, globalPerDay: 2 })
    q.take('a')
    q.take('a') // recusada pelo teto do IP
    expect(q.take('b')).toBe('ok')
  })

  it('zera quando o dia vira no fuso de Fortaleza, não em UTC', () => {
    let agora = new Date('2026-11-03T23:30:00-03:00')
    const q = new DailyQuota({ perIpPerDay: 1, globalPerDay: 100 }, () => agora)
    expect(q.take('a')).toBe('ok')
    // 02:30 UTC do dia 4, mas ainda 23:50 do dia 3 em Fortaleza.
    agora = new Date('2026-11-03T23:50:00-03:00')
    expect(q.take('a')).toBe('ip')
    agora = new Date('2026-11-04T00:10:00-03:00')
    expect(q.take('a')).toBe('ok')
  })
})

describe('POST /api/ai · travas de volume', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    app = createApp(false)
    await registerRoutes(app)
  })

  afterEach(async () => {
    await app.close()
    vi.restoreAllMocks()
  })

  const pedir = (ip: string, payload: unknown = corpo) =>
    app.inject({
      method: 'POST',
      url: '/api/ai',
      payload: payload as object,
      headers: { 'x-forwarded-for': ip },
    })

  it('a rajada passa do limite por minuto e volta 429 rate_limited', async () => {
    const status: number[] = []
    for (let i = 0; i < 4; i++) status.push((await pedir('200.1.1.1')).statusCode)
    expect(status).toEqual([503, 503, 503, 429])
    expect((await pedir('200.1.1.1')).json()).toMatchObject({ code: 'rate_limited' })
  })

  it('o limite é por IP: o X-Forwarded-For do Nginx separa os clientes', async () => {
    for (let i = 0; i < 3; i++) await pedir('200.1.1.1')
    expect((await pedir('200.1.1.1')).statusCode).toBe(429)
    expect((await pedir('200.2.2.2')).statusCode).toBe(503)
  })

  it('o 429 da rajada não diz nada de bastidor', async () => {
    for (let i = 0; i < 3; i++) await pedir('200.1.1.1')
    const body = (await pedir('200.1.1.1')).json()
    expect(body).toEqual({ statusCode: 429, error: 'Muitas consultas no momento.', code: 'rate_limited' })
  })

  it('o teto global da cota diária fecha a IA para IPs novos', async () => {
    // 8 chamadas de 4 IPs (2 cada, abaixo da rajada e da cota por IP) esgotam o global.
    for (const ip of ['200.0.0.1', '200.0.0.2', '200.0.0.3', '200.0.0.4']) {
      expect((await pedir(ip)).statusCode).toBe(503)
      expect((await pedir(ip)).statusCode).toBe(503)
    }
    const res = await pedir('200.9.9.9')
    expect(res.statusCode).toBe(429)
    expect(res.json()).toMatchObject({ code: 'rate_limited' })
  })

  it('corpo acima de 128 KB volta 413 sem chegar ao handler', async () => {
    const res = await pedir('200.1.1.1', { ...corpo, lixo: 'a'.repeat(130 * 1024) })
    expect(res.statusCode).toBe(413)
  })

  it('X-Forwarded-For de quem não é o Nginx é ignorado', async () => {
    // O pedido vem de 10.9.9.9 (não é 127.0.0.1): trocar o cabeçalho a cada vez não
    // dá IP novo, e a rajada pega na quarta.
    const status: number[] = []
    for (let i = 0; i < 4; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/ai',
        payload: corpo,
        remoteAddress: '10.9.9.9',
        headers: { 'x-forwarded-for': `200.0.0.${i}` },
      })
      status.push(res.statusCode)
    }
    expect(status.at(-1)).toBe(429)
  })
})
