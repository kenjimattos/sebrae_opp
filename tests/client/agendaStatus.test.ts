import { describe, expect, it } from 'vitest'
import { agendaStatus } from '@/utils/statusStyles'
import { classifiedValue } from '@/utils/indicatorBar'
import type { Agenda, Indicator, StatusType } from '@/types/indicators'

// O farol da agenda esteve desligado (`agendaStatus` retornava 'none' fixo)
// porque a média incluía os indicadores sem régua. Com a maioria em 'none',
// contá-los como zero pintaria quase toda agenda de vermelho — um agregado
// dominado por ausência de dado, não por desempenho. Estes casos travam a
// exclusão, que é o que separa o farol restaurado do farol que mentia.

function ind(status: StatusType): Indicator {
  return { label: 'x', value: '1', status }
}

function agenda(...statuses: StatusType[]): Agenda {
  return { id: 'a', name: 'A', indicators: statuses.map(ind) }
}

describe("agendaStatus · 'none' fica fora da conta", () => {
  it('ignora os sem régua no numerador E no denominador', () => {
    // 2 verdes entre 2 classificados = 2.0 → verde, por mais que haja 18 sem
    // régua ao lado. Se 'none' contasse como 0, a média seria 0,2 → vermelho.
    const muitosSemRegua: StatusType[] = Array(18).fill('none')
    expect(agendaStatus(agenda('success', 'success', ...muitosSemRegua))).toBe('success')
  })

  it('agenda sem nenhum indicador classificável fica neutra', () => {
    // É o caso real de *Acesso a crédito*: os dois indicadores são valor
    // absoluto em R$, sem régua possível. Neutro é a resposta certa — não verde.
    expect(agendaStatus(agenda('none', 'none'))).toBe('none')
    expect(agendaStatus(agenda())).toBe('none')
  })
})

describe('agendaStatus · média por gravidade, não "pior status manda"', () => {
  it('amarelos sozinhos não viram vermelho', () => {
    // 3 amarelos = média 1,0 → amarelo. Numa regra de pior-status seria o mesmo,
    // mas o caso seguinte é o que as separa.
    expect(agendaStatus(agenda('warning', 'warning', 'warning'))).toBe('warning')
  })

  it('um alerta isolado não condena a agenda inteira', () => {
    // 3 verdes + 1 alerta = 1,5 → verde. Com "pior status manda" seria vermelho.
    expect(agendaStatus(agenda('success', 'success', 'success', 'alert'))).toBe('success')
  })

  it('os cortes 1,5 e 0,5 são >=', () => {
    expect(agendaStatus(agenda('success', 'warning'))).toBe('success') // 1.5
    expect(agendaStatus(agenda('warning', 'alert'))).toBe('warning') // 0.5
    expect(agendaStatus(agenda('alert', 'alert', 'warning'))).toBe('alert') // 0.33
  })
})

describe('classifiedValue · qual número a régua lê', () => {
  const relativo = {
    kind: 'higher-better' as const,
    success: 44.5,
    warning: 29.8,
    provenance: 'relativo-pb' as const,
    basis: { unit: '/1k hab.', label: 'por 1.000 habitantes', denominator: 'populacao' },
  }

  it('faixa relativa lê o normalizado e ignora a contagem bruta', () => {
    // 70.626 vínculos passaria qualquer corte per capita e jogaria o marcador
    // no extremo direito da barra — sem erro e sem aviso.
    expect(
      classifiedValue({ numericValue: 70626, normalizedValue: 168.4, threshold: relativo }),
    ).toBe(168.4)
  })

  it('sem base de comparação devolve null, nunca o bruto', () => {
    expect(
      classifiedValue({ numericValue: 0, normalizedValue: null, threshold: relativo }),
    ).toBeNull()
    expect(
      classifiedValue({ numericValue: 500, normalizedValue: undefined, threshold: relativo }),
    ).toBeNull()
  })

  it('faixa oficial segue lendo o valor da fonte', () => {
    const oficial = { kind: 'higher-better' as const, success: 7.51, warning: 5.01 }
    expect(
      classifiedValue({ numericValue: 7.06, normalizedValue: 999, threshold: oficial }),
    ).toBe(7.06)
  })

  it('sem régua nenhuma devolve o valor da fonte', () => {
    expect(classifiedValue({ numericValue: 42 })).toBe(42)
  })
})
