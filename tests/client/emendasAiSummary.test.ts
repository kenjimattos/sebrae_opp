import { describe, expect, it } from 'vitest'
import type { EmendaEsferaMeta, EmendaValores, EmendasData } from '@/types/emendas'
import { emendasAiSummary } from '@/utils/emendas'

// Resumo de emendas que o chat manda à IA. O que importa aqui é o que impede uma
// leitura errada: as esferas ficam separadas, cada uma com a própria procedência,
// e esfera sem emenda atribuída não vira zero.

const estadoVazio = {
  empenhado: 0,
  pago: 0,
  porAno: {},
  nEmendas: 0,
  nAutores: 0,
  naoMunicipalizado: { empenhado: 0, pago: 0, nota: '' },
}

const meta = (over: Partial<EmendaEsferaMeta>): EmendaEsferaMeta => ({
  janela: { de: 2023, ate: 2026 },
  atribuicao: 'ibge',
  criterioQuebraAnual: 'ano do documento de despesa',
  source: 'CGU',
  coletadoEm: '2026-10-22',
  estado: estadoVazio,
  coberturaMunicipal: 0.88,
  ...over,
})

const federal: EmendaValores = {
  empenhado: 2_000_000,
  pago: 1_500_000,
  porAno: { '2024': { empenhado: 2_000_000, pago: 1_500_000 } },
  porFuncao: {
    Urbanismo: { empenhado: 500_000, pago: 0, nEmendas: 1 },
    Saúde: { empenhado: 1_500_000, pago: 1_500_000, nEmendas: 3 },
  },
  nEmendas: 4,
  nAutores: 2,
}

const estadual: EmendaValores = {
  valor: 300_000,
  empenhado: 300_000,
  pago: 200_000,
  porAno: { '2022': { valor: 300_000, empenhado: 300_000, pago: 200_000 } },
  nEmendas: 1,
  nAutores: 1,
}

function dados(est: EmendaValores | null): EmendasData {
  return {
    esferas: {
      federal: meta({}),
      estadual: meta({
        janela: { de: 2021, ate: 2025 },
        atribuicao: 'texto-beneficiario',
        criterioQuebraAnual: 'ano da emenda',
        source: 'CGE-PB',
        coberturaMunicipal: 0.62,
      }),
    },
    municipios: [{ id: '2504009', name: 'Campina Grande', federal, estadual: est }],
  }
}

describe('emendasAiSummary', () => {
  it('uma seção por esfera, cada uma com fonte, atribuição e eixo do ano', () => {
    const [fed, est] = emendasAiSummary(dados(estadual), '2504009').split('\n\n')
    expect(fed).toMatch(/^EMENDAS FEDERAIS/)
    expect(fed).toContain('CGU')
    expect(fed).toContain('dado exato')
    expect(fed).toContain('ano do documento de despesa')
    expect(est).toMatch(/^EMENDAS ESTADUAIS/)
    expect(est).toContain('CGE-PB')
    expect(est).toContain('ESTIMADO')
    expect(est).toContain('62,0%')
    expect(est).toContain('ano da emenda')
  })

  it('não traz total somado das duas esferas', () => {
    // 2 mi + 300 mil de empenhado: "R$ 2,30 mi" só existiria se alguém somasse.
    expect(emendasAiSummary(dados(estadual), '2504009')).not.toContain('R$ 2,30 mi')
  })

  it('valor destinado só no estadual; o federal não o publica', () => {
    const [fed, est] = emendasAiSummary(dados(estadual), '2504009').split('\n\n')
    expect(fed).not.toContain('valor destinado')
    expect(est).toContain('Total (valor destinado / empenhado / pago): R$ 300 mil / R$ 300 mil / R$ 200 mil')
  })

  it('funções da maior para a menor em empenhado, com singular certo', () => {
    const fed = emendasAiSummary(dados(estadual), '2504009').split('\n\n')[0]
    expect(fed).toContain('Saúde: R$ 1,50 mi / R$ 1,50 mi (3 emendas); Urbanismo: R$ 500 mil / R$ 0 (1 emenda)')
  })

  it('esfera sem emenda atribuída não vira zero', () => {
    const est = emendasAiSummary(dados(null), '2504009').split('\n\n')[1]
    expect(est).toContain('Nenhuma emenda desta esfera foi atribuída a Campina Grande')
    expect(est).toContain('Não significa que o município não recebeu')
    expect(est).not.toContain('R$ 0')
  })

  it('restrito a uma esfera, traz só ela', () => {
    const so = emendasAiSummary(dados(estadual), '2504009', ['estadual'])
    expect(so).toMatch(/^EMENDAS ESTADUAIS/)
    expect(so).not.toContain('EMENDAS FEDERAIS')
  })

  it('sem payload ou município desconhecido devolve vazio', () => {
    expect(emendasAiSummary(null, '2504009')).toBe('')
    expect(emendasAiSummary(dados(estadual), '2500000')).toBe('')
  })
})
