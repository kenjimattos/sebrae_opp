import { createSign, generateKeyPairSync } from 'node:crypto'

// Tokens de teste do login AMEI. O servidor valida a assinatura com a chave
// pública do realm (`realmPublicKey`, sem rede); aqui se gera o par e se assina
// com a privada, no mesmo estilo do vertex.test.ts. Vive junto do config mockado
// de cada teste: o mock importa `keycloakTestConfig` daqui.

const URL_AMEI = 'https://amei.teste/auth'
const REALM = 'sebrae'
export const CLIENT_ID = 'pippa'

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const outro = generateKeyPairSync('rsa', { modulusLength: 2048 })

// O keycloak-connect espera a chave em base64 sem o cabeçalho PEM.
function base64Der(key: typeof publicKey): string {
  return key.export({ type: 'spki', format: 'der' }).toString('base64')
}

export const keycloakTestConfig = {
  url: URL_AMEI,
  realm: REALM,
  clientId: CLIENT_ID,
  realmPublicKey: base64Der(publicKey),
}

const b64url = (v: object | Buffer) =>
  Buffer.from(v instanceof Buffer ? v : JSON.stringify(v)).toString('base64url')

interface TokenOptions {
  /** Sobrescreve claims (ou os apaga com `undefined`). */
  claims?: Record<string, unknown>
  /** Assina com uma chave que o servidor não conhece. */
  chaveErrada?: boolean
}

export function signToken({ claims = {}, chaveErrada = false }: TokenOptions = {}): string {
  const agora = Math.floor(Date.now() / 1000)
  const payload = {
    iss: `${URL_AMEI}/realms/${REALM}`,
    typ: 'Bearer',
    azp: CLIENT_ID,
    sub: 'usuario-1',
    preferred_username: 'maria',
    name: 'Maria Teste',
    iat: agora,
    exp: agora + 300,
    ...claims,
  }
  const corpo = `${b64url({ alg: 'RS256', typ: 'JWT', kid: 'k1' })}.${b64url(payload)}`
  const assinatura = createSign('RSA-SHA256')
    .update(corpo)
    .sign(chaveErrada ? outro.privateKey : privateKey)
  return `${corpo}.${b64url(assinatura)}`
}

/** Cabeçalho pronto para `app.inject`. */
export function bearer(options?: TokenOptions): { authorization: string } {
  return { authorization: `Bearer ${signToken(options)}` }
}
