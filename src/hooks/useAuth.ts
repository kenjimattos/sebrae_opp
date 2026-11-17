import { createContext, useContext } from 'react'

// O que a UI e o futuro analytics podem saber de quem está logado. `id` é o claim
// `sub` do AMEI: opaco e estável, serve para correlacionar sessões. E-mail não
// entra aqui de propósito — não há tela que precise dele.
export interface AuthUser {
  id: string
  name?: string
}

export interface AuthContextType {
  /** O init do Keycloak terminou. Antes disso `isLoggedIn` ainda não é confiável. */
  ready: boolean
  isLoggedIn: boolean
  user: AuthUser | null
  /** Vai ao AMEI e volta para `redirectPath` (padrão: /home). */
  login: (redirectPath?: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
