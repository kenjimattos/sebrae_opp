// fetch com o token do AMEI. Todo pedido a /api (exceto o health, que o app não
// usa) passa por aqui: o servidor responde 401 a quem não manda Bearer.
import { getKeycloak } from '@/auth/keycloak'

// Renova o token se faltarem menos de 30s para expirar. Se a renovação falha, a
// sessão acabou de verdade (refresh token vencido): volta ao AMEI.
async function currentToken(minValidity: number): Promise<string> {
  const keycloak = getKeycloak()
  try {
    await keycloak.updateToken(minValidity)
  } catch {
    void keycloak.login({ redirectUri: window.location.href })
    throw new Error('Sessão expirada')
  }
  if (!keycloak.token) throw new Error('Sem token')
  return keycloak.token
}

function withBearer(init: RequestInit, token: string): RequestInit {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return { ...init, headers }
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(input, withBearer(init, await currentToken(30)))
  if (res.status !== 401) return res

  // 401 com token que o navegador acha válido: o relógio pode ter andado ou a
  // sessão ter sido revogada. Força UMA renovação e tenta de novo. Sem segunda
  // volta ao AMEI: se o servidor seguir recusando um token recém-emitido o
  // problema é de configuração, e redirecionar de novo faria um laço infinito
  // entre o app e o AMEI. O 401 sobe como erro e a tela o mostra.
  return fetch(input, withBearer(init, await currentToken(-1)))
}
