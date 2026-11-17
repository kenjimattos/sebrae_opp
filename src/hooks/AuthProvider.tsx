import { useCallback, useMemo, type ReactNode } from 'react'
import { useKeycloak } from '@react-keycloak/web'
import { AuthContext, type AuthUser } from '@/hooks/useAuth'

// Estado de login do AMEI (Keycloak). Mantém a interface que o resto do app já
// usava (`isLoggedIn`, `login`, `logout`) e a reimplementa sobre o keycloak-js.
// O `ReactKeycloakProvider` (main.tsx) fica por fora e só monta o app depois do
// init — então aqui `initialized` já é verdadeiro na prática.
export default function AuthProvider({ children }: { children: ReactNode }) {
  const { keycloak, initialized } = useKeycloak()

  const isLoggedIn = initialized && keycloak.authenticated === true
  const sub = keycloak.tokenParsed?.sub
  const name = typeof keycloak.tokenParsed?.name === 'string' ? keycloak.tokenParsed.name : undefined

  const user = useMemo<AuthUser | null>(
    () => (isLoggedIn && sub ? { id: sub, name } : null),
    [isLoggedIn, sub, name],
  )

  const login = useCallback(
    (redirectPath = '/home') => {
      void keycloak.login({ redirectUri: `${window.location.origin}${redirectPath}` })
    },
    [keycloak],
  )

  const logout = useCallback(() => {
    void keycloak.logout({ redirectUri: `${window.location.origin}/` })
  }, [keycloak])

  const value = useMemo(
    () => ({ ready: initialized, isLoggedIn, user, login, logout }),
    [initialized, isLoggedIn, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
