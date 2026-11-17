import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import RequireAuth from '@/components/RequireAuth'
import { AuthContext, type AuthContextType } from '@/hooks/useAuth'

function renderAt(auth: Partial<AuthContextType>, path = '/home?x=1') {
  const login = vi.fn()
  const value: AuthContextType = {
    ready: true,
    isLoggedIn: false,
    user: null,
    login,
    logout: vi.fn(),
    ...auth,
  }
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/home" element={<p>conteúdo protegido</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
  return value.login as ReturnType<typeof vi.fn>
}

describe('RequireAuth', () => {
  it('logado: mostra a rota', () => {
    const login = renderAt({ isLoggedIn: true })
    expect(screen.getByText('conteúdo protegido')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('anônimo: não mostra a rota e manda ao AMEI voltando para a mesma URL', () => {
    const login = renderAt({ isLoggedIn: false })
    expect(screen.queryByText('conteúdo protegido')).not.toBeInTheDocument()
    expect(login).toHaveBeenCalledTimes(1)
    expect(login).toHaveBeenCalledWith('/home?x=1')
  })

  it('antes do init do Keycloak não redireciona nem mostra a rota', () => {
    const login = renderAt({ ready: false, isLoggedIn: false })
    expect(screen.queryByText('conteúdo protegido')).not.toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })
})
