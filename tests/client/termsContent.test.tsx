import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TermsDocument from '@/components/terms/TermsDocument'
import {
  A_CONFIRMAR,
  TERMS_ANALYTICS_SECTION,
  TERMS_SECTIONS,
  TERMS_SUMMARY,
  termsSectionId,
} from '@/data/terms/content'
import { TERMS_VERSION } from '@/data/terms/version'

describe('texto dos termos de uso', () => {
  it('a versão é uma data AAAA-MM-DD (ordenável e legível no comprovante)', () => {
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('ids de seção são únicos (viram âncora e aria-labelledby)', () => {
    const ids = TERMS_SECTIONS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('a seção do Clarity NÃO está no texto vigente: o produto ainda não o usa', () => {
    expect(TERMS_SECTIONS.map((s) => s.id)).not.toContain(TERMS_ANALYTICS_SECTION.id)
    const tudo = JSON.stringify(TERMS_SECTIONS)
    expect(tudo).not.toMatch(/clarity/i)
  })

  it('o texto não nomeia o fornecedor do modelo de IA (sigilo do projeto)', () => {
    expect(JSON.stringify(TERMS_SECTIONS)).not.toMatch(/google|vertex|gemini|openai|anthropic/i)
  })

  it('lista quantos trechos ainda dependem do jurídico do Sebrae', () => {
    // Não é para passar de 0 em produção: o teste existe para o número ficar visível
    // e para ninguém publicar o rascunho sem notar. Baixe-o conforme o Sebrae responder.
    const pendentes = JSON.stringify(TERMS_SECTIONS).split(A_CONFIRMAR).length - 1
    expect(pendentes).toBe(4)
  })

  it('renderiza todas as seções com título e a versão', () => {
    render(<TermsDocument />)
    for (const s of TERMS_SECTIONS) {
      expect(screen.getByRole('heading', { name: s.title })).toBeInTheDocument()
    }
    expect(screen.getByText(`Versão ${TERMS_VERSION}`)).toBeInTheDocument()
  })

  it('o índice tem um link para cada seção, apontando para o id que existe na página', () => {
    const { container } = render(<TermsDocument />)
    const nav = screen.getAllByRole('navigation', { name: 'Índice dos termos' })[0]!
    for (const sec of TERMS_SECTIONS) {
      const link = nav.querySelector(`a[href="#${termsSectionId(sec.id)}"]`)
      expect(link, sec.title).not.toBeNull()
      expect(container.querySelector(`section#${termsSectionId(sec.id)}`), sec.id).not.toBeNull()
    }
  })

  it('o resumo mostra as linhas e não nomeia o fornecedor do modelo', () => {
    render(<TermsDocument />)
    expect(screen.getByRole('heading', { name: 'Em resumo' })).toBeInTheDocument()
    expect(TERMS_SUMMARY).toHaveLength(4)
    for (const line of TERMS_SUMMARY) expect(screen.getByText(line)).toBeInTheDocument()
    expect(TERMS_SUMMARY.join(' ')).not.toMatch(/google|vertex|gemini|openai|anthropic|clarity/i)
  })

  it('cada trecho pendente do jurídico vira <mark> na tela', () => {
    const { container } = render(<TermsDocument />)
    expect(container.querySelectorAll('mark')).toHaveLength(4)
  })

  it('o conteúdo entra depois do texto (é onde fica a barra de aceite)', () => {
    render(
      <TermsDocument>
        <p>barra de aceite</p>
      </TermsDocument>,
    )
    expect(screen.getByText('barra de aceite')).toBeInTheDocument()
  })

  describe('índice acompanha a rolagem', () => {
    afterEach(() => vi.restoreAllMocks())

    // jsdom não calcula layout: o topo de cada seção é dado pelo teste. Seções até
    // `ate` já passaram da linha de leitura (topo <= 0); as demais estão abaixo.
    function rolarAte(ate: number) {
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        const i = TERMS_SECTIONS.findIndex((s) => termsSectionId(s.id) === this.id)
        return { top: i === -1 ? 9999 : i <= ate ? 0 : 500 } as DOMRect
      })
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })
    }

    const marcada = () =>
      screen
        .getAllByRole('navigation', { name: 'Índice dos termos' })[0]!
        .querySelector('a[aria-current="location"]')?.textContent

    it('marca a última seção cujo topo já passou da linha, inclusive a 8 e a 9', async () => {
      render(<TermsDocument />)
      const titulo = (i: number) => TERMS_SECTIONS[i]!.title
      for (const i of [0, 3, 7, 8]) {
        rolarAte(i)
        await waitFor(() => expect(marcada()).toBe(titulo(i)))
      }
    })

    it('a última seção tem altura mínima para o topo dela alcançar a linha no fim da página', () => {
      const { container } = render(<TermsDocument />)
      const ultima = TERMS_SECTIONS.at(-1)!
      expect(container.querySelector(`#${termsSectionId(ultima.id)}`)?.className).toContain('min-h-')
    })
  })
})
