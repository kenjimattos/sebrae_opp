import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import UserMenu from '@/components/layout/UserMenu'
import { AuthContext, type AuthContextType } from '@/hooks/useAuth'

function montar(auth: Partial<AuthContextType> = {}) {
  const logout = vi.fn()
  const value: AuthContextType = {
    ready: true,
    isLoggedIn: true,
    user: { id: 'u1', name: 'Maria Teste' },
    login: vi.fn(),
    logout,
    ...auth,
  }
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter>
        <UserMenu />
        <p>fora do menu</p>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
  return { logout }
}

const botao = () => screen.getByRole('button', { name: 'Minha conta' })

describe('UserMenu', () => {
  it('fechado por padrão: só o ícone, sem o nome na tela', () => {
    montar()
    expect(botao()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Maria Teste')).not.toBeInTheDocument()
  })

  it('abre ao clicar: nome, conta Sebrae, link dos termos e Sair', () => {
    montar()
    fireEvent.click(botao())
    expect(botao()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Maria Teste')).toBeInTheDocument()
    expect(screen.getByText('Conta Sebrae (AMEI)')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Termos de uso e privacidade' })).toHaveAttribute('href', '/termos')
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('o botão aponta para o painel que controla (aria-controls) só enquanto aberto', () => {
    montar()
    expect(botao()).not.toHaveAttribute('aria-controls')
    fireEvent.click(botao())
    const id = botao().getAttribute('aria-controls')
    expect(id).toBeTruthy()
    expect(document.getElementById(id!)).toContainElement(screen.getByText('Maria Teste'))
  })

  it('o nome vai marcado para o Clarity não gravá-lo', () => {
    montar()
    fireEvent.click(botao())
    expect(screen.getByText('Maria Teste')).toHaveAttribute('data-clarity-mask', 'true')
  })

  it('Sair chama o logout', () => {
    const { logout } = montar()
    fireEvent.click(botao())
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('Escape fecha e devolve o foco ao botão', () => {
    montar()
    fireEvent.click(botao())
    screen.getByRole('button', { name: 'Sair' }).focus()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Sair' }), { key: 'Escape' })
    expect(botao()).toHaveAttribute('aria-expanded', 'false')
    expect(botao()).toHaveFocus()
  })

  it('clique fora fecha', () => {
    montar()
    fireEvent.click(botao())
    fireEvent.mouseDown(screen.getByText('fora do menu'))
    expect(screen.queryByText('Maria Teste')).not.toBeInTheDocument()
  })

  it('clicar de novo no ícone fecha', () => {
    montar()
    fireEvent.click(botao())
    fireEvent.click(botao())
    expect(screen.queryByText('Maria Teste')).not.toBeInTheDocument()
  })

  it('escolher os termos fecha o menu', () => {
    montar()
    fireEvent.click(botao())
    fireEvent.click(screen.getByRole('link', { name: 'Termos de uso e privacidade' }))
    expect(screen.queryByText('Maria Teste')).not.toBeInTheDocument()
  })

  it('nome longo (como o do AMEI, que já veio com o e-mail) quebra linha em vez de estourar', () => {
    montar({ user: { id: 'u1', name: 'kenji.yellow@gmail.com kenji mattos de alguma coisa muito longa' } })
    fireEvent.click(botao())
    expect(screen.getByText(/kenji.yellow@gmail.com/)).toHaveClass('break-words')
  })

  it('sem nome no token: mostra "Usuário" em vez de vazio', () => {
    montar({ user: { id: 'u1' } })
    fireEvent.click(botao())
    expect(screen.getByText('Usuário')).toBeInTheDocument()
  })

  it('quem não está logado não vê o menu (a /termos é pública)', () => {
    montar({ isLoggedIn: false, user: null })
    expect(screen.queryByRole('button', { name: 'Minha conta' })).not.toBeInTheDocument()
  })
})
