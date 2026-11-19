import { beforeEach, describe, expect, it, vi } from 'vitest'

// O config lê e valida o ambiente ao ser importado, então cada caso reimporta o módulo.
async function carregar() {
  vi.resetModules()
  return import('../../server/src/config.js')
}

describe('config · variáveis obrigatórias', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.stubEnv('MONGO_URI', 'mongodb://teste')
    vi.stubEnv('KEYCLOAK_REALM', 'externo')
    vi.stubEnv('KEYCLOAK_CLIENT_ID', 'pippa')
    vi.stubEnv('KEYCLOAK_URL', 'https://amei.teste/auth')
    vi.stubEnv('VITE_KEYCLOAK_URL', '')
  })

  it('com as três KEYCLOAK_* o config carrega', async () => {
    const { config } = await carregar()
    expect(config.keycloak).toMatchObject({ url: 'https://amei.teste/auth', realm: 'externo', clientId: 'pippa' })
  })

  it('variável ausente derruba o boot dizendo qual', async () => {
    vi.stubEnv('KEYCLOAK_URL', '')
    await expect(carregar()).rejects.toThrow('Variável de ambiente obrigatória ausente: KEYCLOAK_URL')
  })

  it('só com o prefixo VITE_ (erro comum) o erro explica que o servidor não usa o prefixo', async () => {
    vi.stubEnv('KEYCLOAK_URL', '')
    vi.stubEnv('VITE_KEYCLOAK_URL', 'https://amei.teste/auth')
    await expect(carregar()).rejects.toThrow(/encontrei VITE_KEYCLOAK_URL.*NÃO usa o prefixo VITE_.*renomeie para KEYCLOAK_URL/)
  })

  it('sem dica de prefixo quando não há variável VITE_ correspondente', async () => {
    vi.stubEnv('KEYCLOAK_URL', '')
    const erro = (await carregar().catch((e: Error) => e)) as Error
    expect(erro.message).not.toContain('VITE_')
  })
})
