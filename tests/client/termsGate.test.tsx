import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TermsGate from '@/components/terms/TermsGate'
import { AuthContext } from '@/hooks/useAuth'
import type { TermsAcceptance } from '@/types/terms'

const fetchTermsAcceptance = vi.fn<() => Promise<TermsAcceptance>>()
const postTermsAcceptance = vi.fn<(version: string) => Promise<TermsAcceptance>>()
vi.mock('@/data/api', () => ({
  fetchTermsAcceptance: () => fetchTermsAcceptance(),
  postTermsAcceptance: (v: string) => postTermsAcceptance(v),
}))

const logout = vi.fn()

function montar() {
  render(
    <AuthContext.Provider
      value={{ ready: true, isLoggedIn: true, user: { id: 'u1' }, login: vi.fn(), logout }}
    >
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route element={<TermsGate />}>
            <Route path="/home" element={<p>conteúdo da home</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

const scrollTo = vi.fn()

describe('TermsGate', () => {
  beforeEach(() => {
    scrollTo.mockClear()
    vi.stubGlobal('scrollTo', scrollTo) // jsdom não implementa window.scrollTo
    fetchTermsAcceptance.mockReset()
    postTermsAcceptance.mockReset()
    logout.mockClear()
  })

  it('já aceitou a versão vigente: libera a rota, sem mostrar a tela de aceite', async () => {
    fetchTermsAcceptance.mockResolvedValue({ version: 'v1', accepted: true })
    montar()
    expect(await screen.findByText('conteúdo da home')).toBeInTheDocument()
    expect(screen.queryByText('Aceitar e continuar')).not.toBeInTheDocument()
  })

  it('sem aceite: bloqueia a rota e o botão só habilita com o checkbox marcado', async () => {
    fetchTermsAcceptance.mockResolvedValue({ version: 'v1', accepted: false })
    montar()
    const botao = await screen.findByRole('button', { name: 'Aceitar e continuar' })
    expect(screen.queryByText('conteúdo da home')).not.toBeInTheDocument()
    expect(botao).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(botao).toBeEnabled()
  })

  it('aceitar grava a versão que a tela mostrou e libera a rota', async () => {
    fetchTermsAcceptance.mockResolvedValue({ version: 'v1', accepted: false })
    postTermsAcceptance.mockResolvedValue({ version: 'v1', accepted: true })
    montar()
    fireEvent.click(await screen.findByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar e continuar' }))
    expect(await screen.findByText('conteúdo da home')).toBeInTheDocument()
    expect(postTermsAcceptance).toHaveBeenCalledWith('v1')
  })

  it('depois de aceitar, volta ao topo: a Home não herda a rolagem do documento dos termos', async () => {
    fetchTermsAcceptance.mockResolvedValue({ version: 'v1', accepted: false })
    postTermsAcceptance.mockResolvedValue({ version: 'v1', accepted: true })
    montar()
    fireEvent.click(await screen.findByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar e continuar' }))
    await screen.findByText('conteúdo da home')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 })
  })

  it('aceite que falha NÃO rola para o topo (a pessoa segue no texto)', async () => {
    fetchTermsAcceptance.mockResolvedValue({ version: 'v1', accepted: false })
    postTermsAcceptance.mockRejectedValue(new Error('500'))
    montar()
    fireEvent.click(await screen.findByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar e continuar' }))
    await screen.findByRole('alert')
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('falha ao gravar: avisa, mantém bloqueado e permite tentar de novo', async () => {
    fetchTermsAcceptance.mockResolvedValue({ version: 'v1', accepted: false })
    postTermsAcceptance.mockRejectedValue(new Error('500'))
    montar()
    fireEvent.click(await screen.findByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar e continuar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível registrar o aceite')
    expect(screen.queryByText('conteúdo da home')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Aceitar e continuar' })).toBeEnabled())
  })

  it('recusar sai (logout) e não grava nada', async () => {
    fetchTermsAcceptance.mockResolvedValue({ version: 'v1', accepted: false })
    montar()
    fireEvent.click(await screen.findByRole('button', { name: 'Recusar e sair' }))
    expect(logout).toHaveBeenCalledTimes(1)
    expect(postTermsAcceptance).not.toHaveBeenCalled()
  })

  it('não consegue verificar o aceite: NÃO libera a rota (falha fechada) e oferece nova tentativa', async () => {
    fetchTermsAcceptance.mockRejectedValueOnce(new Error('503'))
    montar()
    expect(await screen.findByRole('alert')).toHaveTextContent('verificar o aceite')
    expect(screen.queryByText('conteúdo da home')).not.toBeInTheDocument()
    fetchTermsAcceptance.mockResolvedValueOnce({ version: 'v1', accepted: true })
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('conteúdo da home')).toBeInTheDocument()
  })

  it('enquanto a API não responde, mostra texto e não uma página em branco', () => {
    fetchTermsAcceptance.mockReturnValue(new Promise(() => {})) // pendurada
    montar()
    expect(screen.getByRole('status')).toHaveTextContent('Verificando os termos de uso…')
    expect(screen.queryByText('conteúdo da home')).not.toBeInTheDocument()
  })

  it('na falha, mostra o status que a API devolveu (login recusado ≠ servidor fora)', async () => {
    fetchTermsAcceptance.mockRejectedValueOnce(new Error('API /terms/acceptance respondeu 401'))
    montar()
    expect(await screen.findByText(/Detalhe técnico: API \/terms\/acceptance respondeu 401/)).toBeInTheDocument()
  })
})
