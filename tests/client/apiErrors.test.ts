import { beforeEach, describe, expect, it, vi } from 'vitest'

// Só o transporte é trocado: o que se testa é como api.ts lê a resposta.
const authFetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>()
vi.mock('@/data/http', () => ({ authFetch: (url: string, init?: RequestInit) => authFetch(url, init) }))

import { fetchMunicipalities, fetchTermsAcceptance, postTermsAcceptance } from '@/data/api'

// A página de bloqueio real do WAF do Sebrae (resumida): 200, text/html.
const PAGINA_DO_WAF = `<html><head><title>Request Rejeitado</title></head><body>
Solicitamos, por gentileza, que envie um e-mail para o Suporte SEBRAE NACIONAL, informando os dados abaixo:<br>
C &oacute;digo de suporte: 17799607942423608254<br></body></html>`

const html = (corpo: string) =>
  new Response(corpo, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })

describe('api.ts · leitura da resposta', () => {
  beforeEach(() => authFetch.mockReset())

  it('JSON normal passa', async () => {
    authFetch.mockResolvedValue(json([{ id: '1', name: 'A', slug: 'a' }]))
    await expect(fetchMunicipalities()).resolves.toEqual([{ id: '1', name: 'A', slug: 'a' }])
  })

  it('HTML com status 200 (bloqueio do WAF) vira erro que diz isso e traz o código de suporte', async () => {
    authFetch.mockResolvedValue(html(PAGINA_DO_WAF))
    const erro = await fetchTermsAcceptance().catch((e: Error) => e)
    expect(erro).toBeInstanceOf(Error)
    expect((erro as Error).message).toContain('/terms/acceptance')
    expect((erro as Error).message).toContain('text/html')
    expect((erro as Error).message).toContain('código de suporte 17799607942423608254')
    expect((erro as Error).message).toMatch(/WAF/)
  })

  it('HTML sem código de suporte ainda é explicado, sem inventar o código', async () => {
    authFetch.mockResolvedValue(html('<html>qualquer coisa</html>'))
    const erro = (await fetchMunicipalities().catch((e: Error) => e)) as Error
    expect(erro.message).toContain('em vez de JSON')
    expect(erro.message).not.toContain('código de suporte')
  })

  it('o POST do aceite também detecta o bloqueio', async () => {
    authFetch.mockResolvedValue(html(PAGINA_DO_WAF))
    await expect(postTermsAcceptance('2026-11-17')).rejects.toThrow(/17799607942423608254/)
  })

  it('status de erro segue dizendo o status, não "HTML"', async () => {
    authFetch.mockResolvedValue(json({ error: 'x' }, 500))
    await expect(fetchTermsAcceptance()).rejects.toThrow('API /terms/acceptance respondeu 500')
  })

  it('corpo vazio sem content-type não derruba com erro obscuro', async () => {
    authFetch.mockResolvedValue(new Response('', { status: 200 }))
    await expect(fetchMunicipalities()).rejects.toThrow(/em vez de JSON/)
  })
})
