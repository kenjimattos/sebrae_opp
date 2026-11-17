import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TermsDocument from '@/components/terms/TermsDocument'
import { A_CONFIRMAR, TERMS_ANALYTICS_SECTION, TERMS_SECTIONS } from '@/data/terms/content'
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
})
