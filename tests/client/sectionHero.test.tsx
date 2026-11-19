import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SectionHero from '@/components/sections/SectionHero'
import ConfirmProvider from '@/hooks/ConfirmProvider'
import { AuthContext, type AuthContextType } from '@/hooks/useAuth'

// Escolher a Paraíba sem estar logado leva ao AMEI, que é outra tela. Sem aviso
// antes, parecia que o clique tinha dado errado. Logado, entra direto.

function montar(isLoggedIn: boolean) {
  const login = vi.fn()
  const auth: AuthContextType = { ready: true, isLoggedIn, user: null, login, logout: vi.fn() }
  render(
    <MemoryRouter initialEntries={['/']}>
      <ConfirmProvider>
        <AuthContext.Provider value={auth}>
          <Routes>
            <Route path="/" element={<SectionHero />} />
            <Route path="/home" element={<p>home</p>} />
          </Routes>
        </AuthContext.Provider>
      </ConfirmProvider>
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Estado: nenhum selecionado' }))
  fireEvent.click(screen.getByRole('button', { name: 'Paraíba' }))
  return login
}

describe('SectionHero — entrada', () => {
  it('sem login, avisa antes de ir ao AMEI e só vai ao confirmar', async () => {
    const login = montar(false)
    expect(screen.getByRole('dialog', { name: 'Entrar com o AMEI' })).toBeTruthy()
    expect(login).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Ir para o login' }))
    await waitFor(() => expect(login).toHaveBeenCalledWith('/home'))
  })

  it('sem login, cancelar fica na entrada', async () => {
    const login = montar(false)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(login).not.toHaveBeenCalled()
  })

  it('logado, entra direto sem aviso', () => {
    const login = montar(true)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('home')).toBeTruthy()
    expect(login).not.toHaveBeenCalled()
  })
})
