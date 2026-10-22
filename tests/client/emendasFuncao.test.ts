import { describe, expect, it } from 'vitest'
import type { EmendaValores } from '@/types/emendas'
import { formatPercentual, linhasPorFuncao } from '@/utils/emendas'

function valores(porFuncao: EmendaValores['porFuncao']): EmendaValores {
  return { empenhado: 0, pago: 0, porAno: {}, porFuncao, nEmendas: 0, nAutores: 0 }
}

describe('linhasPorFuncao', () => {
  it('ordena pelo maior empenhado e calcula em aberto e fração paga', () => {
    const linhas = linhasPorFuncao(
      valores({
        Urbanismo: { empenhado: 300, pago: 100, nEmendas: 1 },
        Saúde: { empenhado: 600, pago: 540, nEmendas: 3 },
      }),
    )
    expect(linhas.map((l) => l.funcao)).toEqual(['Saúde', 'Urbanismo'])
    expect(linhas[0]).toMatchObject({ emAberto: 60, fracaoPaga: 0.9, nEmendas: 3 })
  })

  it('sem a quebra (estadual, snapshot antigo) devolve lista vazia', () => {
    expect(linhasPorFuncao(valores(undefined))).toEqual([])
    expect(linhasPorFuncao(null)).toEqual([])
  })

  it('empenhado zero não divide: fração null, em aberto negativo é mantido', () => {
    const [l] = linhasPorFuncao(valores({ Múltiplo: { empenhado: 0, pago: 50, nEmendas: 1 } }))
    expect(l!.fracaoPaga).toBeNull()
    expect(l!.emAberto).toBe(-50)
    expect(formatPercentual(l!.fracaoPaga)).toBe('—')
  })

  it('empate no empenhado desempata por nome, para a ordem não mudar entre cargas', () => {
    const linhas = linhasPorFuncao(
      valores({
        Cultura: { empenhado: 10, pago: 0, nEmendas: 1 },
        Agricultura: { empenhado: 10, pago: 0, nEmendas: 1 },
      }),
    )
    expect(linhas.map((l) => l.funcao)).toEqual(['Agricultura', 'Cultura'])
  })
})

describe('formatPercentual', () => {
  it('usa vírgula e uma casa', () => {
    expect(formatPercentual(0.9147)).toBe('91,5%')
    expect(formatPercentual(1)).toBe('100,0%')
  })
})
