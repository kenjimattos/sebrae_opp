import Keycloak, { type KeycloakInitOptions } from 'keycloak-js'

// Login AMEI (Keycloak do Sebrae). O SPA é um client PÚBLICO com PKCE: não há
// secret aqui, e não pode haver — tudo com prefixo VITE_ vai para o bundle e é
// visível a qualquer um. O secret (se o Sebrae entregar um) vive só no servidor.

function viteVar(name: 'VITE_KEYCLOAK_URL' | 'VITE_KEYCLOAK_REALM' | 'VITE_KEYCLOAK_CLIENT_ID'): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Variável ${name} ausente: copie .env.example para .env.local e preencha.`)
  }
  return value
}

let instance: Keycloak | null = null

// Singleton preguiçoso: a mesma instância serve ao `ReactKeycloakProvider` e ao
// `authFetch` (que está fora da árvore React e precisa do token). Preguiçoso
// para que importar o módulo em teste não exija as variáveis de ambiente.
export function getKeycloak(): Keycloak {
  if (instance) return instance
  const keycloak = new Keycloak({
    url: viteVar('VITE_KEYCLOAK_URL'),
    realm: viteVar('VITE_KEYCLOAK_REALM'),
    clientId: viteVar('VITE_KEYCLOAK_CLIENT_ID'),
  })

  // `init` idempotente. O keycloak-js lança "A 'Keycloak' instance can only be
  // initialized once" na segunda chamada, e o StrictMode do React (dev) monta o
  // `ReactKeycloakProvider` duas vezes, então o init é chamado duas vezes. Quem
  // chama de novo recebe a MESMA promessa do primeiro init, em vez de um erro que
  // pareceria falha de login. Em produção (sem StrictMode) é um init só, como sempre.
  const init = keycloak.init.bind(keycloak)
  let initializing: Promise<boolean> | null = null
  keycloak.init = (options) => (initializing ??= init(options))

  instance = keycloak
  return keycloak
}

// `check-sso`: a `/` (escolha da UF) é pública, então o init só verifica se já
// há sessão, sem forçar o login. `RequireAuth` é quem manda para o AMEI.
// Sem `checkLoginIframe`: o iframe de status exige cookie de terceiros, que os
// navegadores bloqueiam, e a expiração já é tratada por `updateToken`.
export const keycloakInitOptions: KeycloakInitOptions = {
  onLoad: 'check-sso',
  pkceMethod: 'S256',
  silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  checkLoginIframe: false,
}
