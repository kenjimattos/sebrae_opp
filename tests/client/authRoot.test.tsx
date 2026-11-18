import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AuthRoot from '@/auth/AuthRoot'

// O módulo real lê as VITE_KEYCLOAK_* e criaria um Keycloak de verdade.
vi.mock('@/auth/keycloak', () => ({ getKeycloak: () => ({}), keycloakInitOptions: {} }))

// O provider real faz o init contra o AMEI. Aqui ele só mostra a tela de carregamento
// e deixa o teste disparar os eventos que a biblioteca dispararia.
let emit: (event: string, error?: unknown) => void = () => {}
vi.mock('@react-keycloak/web', () => ({
  ReactKeycloakProvider: (props: {
    LoadingComponent: ReactNode
    onEvent: (event: string, error?: unknown) => void
    children: ReactNode
  }) => {
    emit = props.onEvent
    return <>{props.LoadingComponent}</>
  },
}))

describe('AuthRoot', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('enquanto o init não termina mostra "Verificando sessão…", sem pressa', () => {
    render(<AuthRoot>app</AuthRoot>)
    expect(screen.getByText('Verificando sessão…')).toBeInTheDocument()
    expect(screen.queryByText(/demorando/)).not.toBeInTheDocument()
  })

  it('passados 8s sem resposta, avisa que está demorando e oferece nova tentativa', () => {
    render(<AuthRoot>app</AuthRoot>)
    act(() => {
      vi.advanceTimersByTime(8000)
    })
    expect(screen.getByText(/Está demorando mais que o normal/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('falha no init: troca o carregamento eterno por um erro com o detalhe e nova tentativa', () => {
    render(<AuthRoot>app</AuthRoot>)
    act(() => emit('onInitError', new Error('Timeout when waiting for 3rd party check iframe message.')))
    expect(screen.getByRole('heading', { name: 'Não foi possível verificar a sessão' })).toBeInTheDocument()
    expect(screen.getByText(/Timeout when waiting for 3rd party check iframe message/)).toBeInTheDocument()
    expect(screen.queryByText('Verificando sessão…')).not.toBeInTheDocument()
    expect(console.error).toHaveBeenCalled()
  })

  it('outros eventos do Keycloak não derrubam a tela', () => {
    render(<AuthRoot>app</AuthRoot>)
    act(() => emit('onAuthSuccess'))
    act(() => emit('onTokenExpired'))
    expect(screen.getByText('Verificando sessão…')).toBeInTheDocument()
  })

  it('"Tentar de novo" recarrega a página', () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    render(<AuthRoot>app</AuthRoot>)
    act(() => emit('onInitError', 'rede'))
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(reload).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})
