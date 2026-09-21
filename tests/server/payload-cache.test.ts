import { afterEach, describe, expect, it, vi } from 'vitest'
import { cachedPayload, invalidatePayloads } from '../../server/src/infra/payload-cache.js'

afterEach(() => {
  invalidatePayloads()
  vi.useRealTimers()
})

describe('cachedPayload', () => {
  it('serve a mesma resposta sem chamar o loader de novo', async () => {
    const load = vi.fn(async () => ({ n: 1 }))

    const a = await cachedPayload('k', load)
    const b = await cachedPayload('k', load)

    expect(load).toHaveBeenCalledTimes(1)
    expect(b).toBe(a)
  })

  // O caso que motiva o cache: o pico de acesso não pode virar pico de query.
  // Guardar a Promise (e não o valor) é o que faz as requisições concorrentes
  // com cache frio esperarem a primeira leitura em vez de abrir cada uma a sua.
  it('requisições simultâneas com cache frio compartilham uma leitura só', async () => {
    const load = vi.fn(async () => ({ n: 1 }))

    const all = await Promise.all(
      Array.from({ length: 50 }, () => cachedPayload('k', load)),
    )

    expect(load).toHaveBeenCalledTimes(1)
    expect(new Set(all).size).toBe(1)
  })

  it('chaves diferentes não se misturam', async () => {
    const a = await cachedPayload('a', async () => 'valor-a')
    const b = await cachedPayload('b', async () => 'valor-b')

    expect(a).toBe('valor-a')
    expect(b).toBe('valor-b')
  })

  // Erro cacheado seria um 503 preso pelo TTL inteiro depois de o problema já
  // estar resolvido no banco — o caso de /api/emendas com os seeds rodando.
  it('não guarda erro: a requisição seguinte tenta de novo', async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('coleção vazia'))
      .mockResolvedValueOnce('ok')

    await expect(cachedPayload('k', load)).rejects.toThrow('coleção vazia')
    await expect(cachedPayload('k', load)).resolves.toBe('ok')
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('relê depois do TTL — é como a carga do ETL chega sem reiniciar o serviço', async () => {
    vi.useFakeTimers()
    const load = vi.fn(async () => Date.now())

    await cachedPayload('k', load)
    vi.advanceTimersByTime(4 * 60_000)
    await cachedPayload('k', load)
    expect(load).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(2 * 60_000)
    await cachedPayload('k', load)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('invalidatePayloads força releitura', async () => {
    const load = vi.fn(async () => 1)

    await cachedPayload('k', load)
    invalidatePayloads()
    await cachedPayload('k', load)

    expect(load).toHaveBeenCalledTimes(2)
  })
})
