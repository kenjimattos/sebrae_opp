import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clarityProjectId } from '@/analytics/clarity'
import AnalyticsConsentBanner from '@/components/analytics/AnalyticsConsentBanner'
import AnalyticsProvider from '@/hooks/AnalyticsProvider'
import { useAnalytics } from '@/hooks/useAnalytics'
import { AuthContext, type AuthUser } from '@/hooks/useAuth'

const ID = 'abc123xyz9'
const tag = () => document.getElementById('clarity-tag') as HTMLScriptElement | null
const comandos = () => window.clarity?.q ?? []

function Revogar() {
  const { deny } = useAnalytics()
  return <button onClick={deny}>revogar</button>
}

function montar(user: AuthUser | null = { id: 'sub-1', name: 'Maria' }) {
  return render(
    <AuthContext.Provider
      value={{ ready: true, isLoggedIn: user !== null, user, login: vi.fn(), logout: vi.fn() }}
    >
      <AnalyticsProvider>
        <MemoryRouter>
          <AnalyticsConsentBanner />
          <Revogar />
        </MemoryRouter>
      </AnalyticsProvider>
    </AuthContext.Provider>,
  )
}

// O Node 25 tem um `localStorage` próprio (sem `clear`, sem arquivo) que encobre o do
// jsdom; cada teste recebe um em memória.
function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  }
}

const banner = () => screen.queryByRole('region', { name: 'Análise de uso' })

describe('Clarity: consentimento e carregamento', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    tag()?.remove()
    delete window.clarity
    vi.stubEnv('VITE_CLARITY_PROJECT_ID', ID)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('ID do projeto', () => {
    it('ausente: nada configurado', () => {
      vi.stubEnv('VITE_CLARITY_PROJECT_ID', '')
      expect(clarityProjectId()).toBeNull()
    })

    it('fora do formato: recusado, não vai para a URL do script', () => {
      vi.stubEnv('VITE_CLARITY_PROJECT_ID', 'abc"/><script>')
      expect(clarityProjectId()).toBeNull()
    })

    it('válido: aceito, sem espaço em volta', () => {
      vi.stubEnv('VITE_CLARITY_PROJECT_ID', ` ${ID} `)
      expect(clarityProjectId()).toBe(ID)
    })
  })

  it('sem ID no build: nenhum banner e nenhum script', () => {
    vi.stubEnv('VITE_CLARITY_PROJECT_ID', '')
    montar()
    expect(banner()).not.toBeInTheDocument()
    expect(tag()).toBeNull()
  })

  it('antes da resposta: banner na tela e o script NÃO carrega', () => {
    montar()
    expect(banner()).toBeInTheDocument()
    expect(tag()).toBeNull()
  })

  it('Aceitar: carrega o script do projeto e identifica só pelo sub', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }))
    expect(banner()).not.toBeInTheDocument()
    expect(tag()?.src).toBe(`https://www.clarity.ms/tag/${ID}`)
    expect(comandos()).toContainEqual(['identify', 'sub-1'])
    expect(JSON.stringify(comandos())).not.toContain('Maria')
    expect(localStorage.getItem('analytics-consent:sub-1')).toBe('granted')
  })

  it('Recusar: banner some, nada carrega, e a recusa fica gravada', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }))
    expect(banner()).not.toBeInTheDocument()
    expect(tag()).toBeNull()
    expect(localStorage.getItem('analytics-consent:sub-1')).toBe('denied')
  })

  it('"sim" de uma visita anterior: carrega direto, sem banner', () => {
    localStorage.setItem('analytics-consent:sub-1', 'granted')
    montar()
    expect(banner()).not.toBeInTheDocument()
    expect(tag()).not.toBeNull()
  })

  it('o "sim" é por usuário: outra pessoa no mesmo navegador é perguntada de novo', () => {
    localStorage.setItem('analytics-consent:sub-1', 'granted')
    montar({ id: 'sub-2' })
    expect(banner()).toBeInTheDocument()
    expect(tag()).toBeNull()
  })

  it('sem login: não pergunta nem carrega', () => {
    montar(null)
    expect(banner()).not.toBeInTheDocument()
    expect(tag()).toBeNull()
  })

  it('revogar depois do "sim": apaga os cookies do Clarity e recarrega a página', () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    localStorage.setItem('analytics-consent:sub-1', 'granted')
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'revogar' }))
    expect(localStorage.getItem('analytics-consent:sub-1')).toBe('denied')
    expect(comandos()).toContainEqual([
      'consentv2',
      { ad_Storage: 'denied', analytics_Storage: 'denied' },
    ])
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('recusar sem ter aceitado antes não recarrega (não há script a tirar)', () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }))
    expect(reload).not.toHaveBeenCalled()
  })

  it('localStorage que lança: pergunta de novo e não carrega nada sozinho', () => {
    const bloqueado = () => {
      throw new Error('bloqueado')
    }
    vi.stubGlobal('localStorage', { ...memoryStorage(), getItem: bloqueado, setItem: bloqueado })
    montar()
    expect(banner()).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }))
    expect(banner()).not.toBeInTheDocument()
    expect(tag()).toBeNull()
  })
})
