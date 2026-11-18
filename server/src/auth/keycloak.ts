import type { FastifyReply, FastifyRequest } from 'fastify'
import Keycloak from 'keycloak-connect'

// Proteção das rotas com o login AMEI (Keycloak do Sebrae). O SPA manda o
// access_token em `Authorization: Bearer`; aqui o keycloak-connect, em modo
// bearer-only, confere assinatura (JWKS do AMEI), validade e issuer.
//
// O keycloak-connect é feito para Express, e três coisas não encaixam no Fastify:
// - ele só lê o token depois do GrantAttacher, que preenche `req.kauth`;
// - o acesso negado padrão chama `res.status(403)`, que o ServerResponse cru do
//   Node não tem, e responde 403 — aqui vira um 401 lançado ao Fastify;
// - `kauth` fica no objeto cru (`req.raw`), não em `req`. Quem consome lê
//   `req.user`, que este hook preenche.

export interface AuthUser {
  /** Claim `sub`: identificador opaco e estável do usuário no AMEI. */
  id: string
  username?: string
  name?: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser | null
  }
  interface FastifyContextConfig {
    /** Rota sem login (só o health check). O resto exige token. */
    public?: boolean
  }
}

export interface KeycloakSettings {
  url: string
  realm: string
  clientId: string
  clientSecret?: string
  realmPublicKey?: string
}

interface AccessTokenClaims {
  sub?: string
  azp?: string
  preferred_username?: string
  name?: string
}

interface GrantLike {
  access_token?: { content?: AccessTokenClaims }
}

interface KauthRequest {
  kauth?: { grant?: GrantLike }
}

type Next = (err?: unknown) => void

// O keycloak-connect busca as chaves de assinatura (JWKS) no AMEI na primeira
// validação e a requisição dele NÃO tem timeout. Se esta máquina não alcança o AMEI
// e a rede DESCARTA os pacotes (em vez de recusar), a chamada fica pendurada por
// minutos: o navegador espera, e a tela fica em branco sem erro nenhum. Aqui o
// limite é nosso.
const GRANT_TIMEOUT_MS = 8000

export class UnauthorizedError extends Error {
  readonly statusCode = 401
  constructor() {
    // Mensagem fixa: o corpo do erro chega ao navegador e o motivo real (token
    // expirado, issuer errado…) vai só para o log.
    super('Acesso não autorizado.')
  }
}

// O login (AMEI) não respondeu a tempo: não é culpa do token, então não é 401.
export class AuthUnavailableError extends Error {
  readonly statusCode = 503
  constructor() {
    super('Serviço de login indisponível.')
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AuthUnavailableError()), ms)
  })
  return Promise.race([promise, expired]).finally(() => clearTimeout(timer))
}

export function createAuthGuard(settings: KeycloakSettings, options: { timeoutMs?: number } = {}) {
  const timeoutMs = options.timeoutMs ?? GRANT_TIMEOUT_MS
  const keycloak = new Keycloak(
    {},
    {
      'auth-server-url': settings.url,
      realm: settings.realm,
      resource: settings.clientId,
      'bearer-only': true,
      ...(settings.clientSecret ? { credentials: { secret: settings.clientSecret } } : {}),
      ...(settings.realmPublicKey ? { 'realm-public-key': settings.realmPublicKey } : {}),
    } as unknown as Keycloak.KeycloakConfig,
  )

  // Padrão do keycloak-connect: `res.status(403)`. Aqui: 401 pelo Fastify.
  const denied = (_req: unknown, _res: unknown, next: Next): void => next(new UnauthorizedError())
  ;(keycloak as unknown as { accessDenied: typeof denied }).accessDenied = denied

  const guard = keycloak.protect()

  function callGuard(raw: unknown, res: unknown): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const run = guard as unknown as (req: unknown, res: unknown, next: Next) => void
      run(raw, res, (err) => (err ? reject(err) : resolve()))
    })
  }

  // preHandler do Fastify.
  return async function protect(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (req.routeOptions.config.public) return

    const raw = req.raw as unknown as KauthRequest
    raw.kauth = {}
    try {
      raw.kauth.grant = (await withTimeout(
        keycloak.getGrant(
          req.raw as unknown as Parameters<typeof keycloak.getGrant>[0],
          reply.raw as unknown as Parameters<typeof keycloak.getGrant>[1],
        ),
        timeoutMs,
      )) as unknown as GrantLike
    } catch (err) {
      if (err instanceof AuthUnavailableError) {
        // O detalhe vai para o log de quem opera; o corpo da resposta fica genérico.
        req.log.error(
          `[auth] o AMEI não respondeu em ${timeoutMs}ms — a máquina da API alcança ${settings.url}? (ver server/README.md, §Login)`,
        )
        throw err
      }
      // Sem cabeçalho, token expirado, assinatura ou issuer errados: todos caem
      // aqui. O motivo (sem o token) fica no log de quem opera.
      req.log.info({ reason: err instanceof Error ? err.message : 'desconhecido' }, '[auth] token recusado')
    }

    try {
      await callGuard(req.raw, reply.raw)
    } catch (err) {
      reply.header('www-authenticate', 'Bearer')
      throw err instanceof UnauthorizedError ? err : new UnauthorizedError()
    }

    const claims = raw.kauth.grant?.access_token?.content
    // O realm é compartilhado com as outras plataformas do Sebrae: um token
    // emitido para o client de OUTRO sistema tem assinatura e issuer válidos
    // aqui. O `azp` (client que pediu o token) é o que separa. O
    // `verifyTokenAudience` do keycloak-connect não serve: exige `aud` com o
    // client, e o Keycloak só o põe com audience mapper.
    if (!claims?.sub || claims.azp !== settings.clientId) {
      req.log.info('[auth] token de outro client ou sem sub')
      reply.header('www-authenticate', 'Bearer')
      throw new UnauthorizedError()
    }
    req.user = { id: claims.sub, username: claims.preferred_username, name: claims.name }
  }
}
