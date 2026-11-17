import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthProvider from '@/hooks/AuthProvider'
import { useAuth } from '@/hooks/useAuth'

const keycloak = {
  authenticated: true as boolean | undefined,
  tokenParsed: { sub: 'abc-123', name: 'Maria Teste' } as Record<string, unknown> | undefined,
  login: vi.fn(async () => {}),
  logout: vi.fn(async () => {}),
}
let initialized = true
vi.mock('@react-keycloak/web', () => ({
  useKeycloak: () => ({ keycloak, initialized }),
}))

function Sonda() {
  const { ready, isLoggedIn, user, login, logout } = useAuth()
  return (
    <div>
      <p>ready={String(ready)} logado={String(isLoggedIn)} id={user?.id ?? '-'} nome={user?.name ?? '-'}</p>
      <button onClick={() => login()}>entrar</button>
      <button onClick={() => login('/trilhas')}>entrar-trilhas</button>
      <button onClick={logout}>sair</button>
    </div>
  )
}

const montar = () =>
  render(
    <AuthProvider>
      <Sonda />
    </AuthProvider>,
  )

describe('AuthProvider (sobre o Keycloak)', () => {
  beforeEach(() => {
    initialized = true
    keycloak.authenticated = true
    keycloak.tokenParsed = { sub: 'abc-123', name: 'Maria Teste' }
    keycloak.login.mockClear()
    keycloak.logout.mockClear()
  })

  it('expõe o sub como id e o nome, e nada além disso', () => {
    montar()
    expect(screen.getByText(/ready=true logado=true id=abc-123 nome=Maria Teste/)).toBeInTheDocument()
  })

  it('sem sessão: não está logado e não há usuário', () => {
    keycloak.authenticated = false
    keycloak.tokenParsed = undefined
    montar()
    expect(screen.getByText(/logado=false id=- nome=-/)).toBeInTheDocument()
  })

  it('antes do init o Keycloak ainda não decide: ready=false e deslogado', () => {
    initialized = false
    montar()
    expect(screen.getByText(/ready=false logado=false/)).toBeInTheDocument()
  })

  it('login volta para /home por padrão e aceita outro destino', () => {
    montar()
    fireEvent.click(screen.getByText('entrar'))
    expect(keycloak.login).toHaveBeenLastCalledWith({ redirectUri: `${window.location.origin}/home` })
    fireEvent.click(screen.getByText('entrar-trilhas'))
    expect(keycloak.login).toHaveBeenLastCalledWith({ redirectUri: `${window.location.origin}/trilhas` })
  })

  it('logout volta para a /', () => {
    montar()
    fireEvent.click(screen.getByText('sair'))
    expect(keycloak.logout).toHaveBeenCalledWith({ redirectUri: `${window.location.origin}/` })
  })
})
