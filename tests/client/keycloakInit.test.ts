import { beforeEach, describe, expect, it, vi } from 'vitest'

// O keycloak-js real fala com o AMEI. Aqui ele é um duplo que, como o de verdade,
// LANÇA na segunda chamada de `init`.
const initReal = vi.fn()
vi.mock('keycloak-js', () => ({
  default: class FakeKeycloak {
    #chamado = false
    init(options: unknown) {
      initReal(options)
      if (this.#chamado) return Promise.reject(new Error("A 'Keycloak' instance can only be initialized once."))
      this.#chamado = true
      return Promise.resolve(false)
    }
  },
}))

describe('getKeycloak', () => {
  beforeEach(() => {
    vi.resetModules()
    initReal.mockClear()
    vi.stubEnv('VITE_KEYCLOAK_URL', 'https://amei.teste/auth')
    vi.stubEnv('VITE_KEYCLOAK_REALM', 'externo')
    vi.stubEnv('VITE_KEYCLOAK_CLIENT_ID', 'pippa')
  })

  it('devolve sempre a mesma instância', async () => {
    const { getKeycloak } = await import('@/auth/keycloak')
    expect(getKeycloak()).toBe(getKeycloak())
  })

  it('init chamado duas vezes (StrictMode) inicializa uma vez só e não lança', async () => {
    const { getKeycloak } = await import('@/auth/keycloak')
    const kc = getKeycloak()
    const primeira = kc.init({ onLoad: 'check-sso' })
    const segunda = kc.init({ onLoad: 'check-sso' })
    await expect(segunda).resolves.toBe(false)
    await expect(primeira).resolves.toBe(false)
    expect(initReal).toHaveBeenCalledTimes(1)
  })

  it('falta de variável de ambiente falha com mensagem clara', async () => {
    vi.stubEnv('VITE_KEYCLOAK_REALM', '')
    const { getKeycloak } = await import('@/auth/keycloak')
    expect(() => getKeycloak()).toThrow(/VITE_KEYCLOAK_REALM/)
  })
})
