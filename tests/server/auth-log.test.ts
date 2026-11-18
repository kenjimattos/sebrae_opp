import { Writable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../server/src/app.js'
import { createAuthGuard } from '../../server/src/auth/keycloak.js'
import { bearer, keycloakTestConfig, signToken } from './token.js'

// Quando o login falha numa máquina que ninguém aqui alcança, o log é a única
// pista. Ele tem de dizer QUAL das causas é (issuer, client, relógio) e nunca
// conter o token.

async function recusa(headers: Record<string, string>) {
  const linhas: Record<string, unknown>[] = []
  const stream = new Writable({
    write(chunk: Buffer, _enc, cb) {
      for (const l of chunk.toString().split('\n').filter(Boolean)) linhas.push(JSON.parse(l))
      cb()
    },
  })
  const app = createApp({ level: 'info', stream })
  app.decorateRequest('user', null)
  app.addHook('preHandler', createAuthGuard(keycloakTestConfig))
  app.get('/x', async () => ({ ok: true }))
  const res = await app.inject({ method: 'GET', url: '/x', headers })
  const auth = linhas.find((l) => String(l.msg).startsWith('[auth]'))
  return { res, auth, todas: JSON.stringify(linhas) }
}

describe('log de token recusado', () => {
  it('issuer diferente: mostra o esperado e o recebido', async () => {
    const { res, auth } = await recusa(bearer({ claims: { iss: 'https://outro.host/auth/realms/x' } }))
    expect(res.statusCode).toBe(401)
    expect(auth).toMatchObject({
      msg: '[auth] token recusado',
      reason: expect.stringContaining('ISS'),
      esperado: { iss: 'https://amei.teste/auth/realms/sebrae', azp: 'pippa' },
      recebido: { iss: 'https://outro.host/auth/realms/x', azp: 'pippa' },
    })
  })

  it('client diferente: mostra o azp esperado e o recebido', async () => {
    const { res, auth } = await recusa(bearer({ claims: { azp: 'pippas' } }))
    expect(res.statusCode).toBe(401)
    expect(auth).toMatchObject({
      msg: '[auth] token de outro client ou sem sub',
      esperado: { azp: 'pippa' },
      recebido: { azp: 'pippas', sub: true },
    })
  })

  it('expirado: traz o exp do token e a hora desta máquina, para ver relógio desajustado', async () => {
    const passado = Math.floor(Date.now() / 1000) - 120
    const { auth } = await recusa(bearer({ claims: { exp: passado, iat: passado - 300 } }))
    expect(auth).toMatchObject({ reason: expect.stringContaining('expired'), recebido: { exp: passado } })
    expect(Math.abs((auth as { agora: number }).agora - Math.floor(Date.now() / 1000))).toBeLessThan(5)
  })

  it('nunca escreve o token no log', async () => {
    const token = signToken({ claims: { iss: 'https://outro.host/auth/realms/x' } })
    const { todas } = await recusa({ authorization: `Bearer ${token}` })
    expect(todas).not.toContain(token)
    // nem o payload nem a assinatura, que são pedaços do token
    for (const parte of token.split('.').slice(1)) expect(todas).not.toContain(parte)
  })

  it('cabeçalho lixo não derruba o log', async () => {
    const { res } = await recusa({ authorization: 'Bearer isto.nao.eh-jwt' })
    expect(res.statusCode).toBe(401)
  })
})
