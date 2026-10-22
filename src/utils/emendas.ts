import type { EmendaValores } from '@/types/emendas'
import { formatBRL } from '@/utils/currency'

/**
 * R$ abreviado em escala BR (bi/mi/mil). Os valores vão de milhares a bilhões no
 * mesmo mapa, então o número cheio quebraria a leitura dos cards e do tooltip.
 */
export function formatReaisCurto(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  if (v === 0) return 'R$ 0'
  const abs = Math.abs(v)
  const fmt = (n: number, casas: number) =>
    n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
  if (abs >= 1e9) return `R$ ${fmt(v / 1e9, 2)} bi`
  if (abs >= 1e6) return `R$ ${fmt(v / 1e6, 2)} mi`
  if (abs >= 1e3) return `R$ ${fmt(v / 1e3, 0)} mil`
  return `R$ ${fmt(v, 0)}`
}

/**
 * R$ por extenso, para tooltips e detalhamento onde a precisão importa. Só
 * acrescenta ao `formatBRL` o que é próprio das emendas: ausência de valor —
 * que aqui é significativa (ver a regra do zero estadual em CLAUDE.md).
 */
export function formatReaisCheio(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return formatBRL(v)
}

/** Anos presentes na quebra anual, em ordem crescente. */
export function anosDe(valores: EmendaValores | null | undefined): string[] {
  if (!valores?.porAno) return []
  return Object.keys(valores.porAno).sort()
}

export interface LinhaFuncao {
  funcao: string
  empenhado: number
  pago: number
  /** Empenhado que ainda não foi pago. */
  emAberto: number
  /** pago / empenhado (0–1); `null` quando não há empenhado — divisão sem sentido. */
  fracaoPaga: number | null
  nEmendas: number
}

/**
 * Linhas da tabela por função, da maior para a menor em empenhado.
 *
 * `emAberto` é `empenhado − pago` e pode sair negativo: o pago é o do documento de
 * pagamento (inclui restos a pagar de safras anteriores à janela do empenho), então
 * numa função pequena ele pode passar do empenhado. Não é cortado em zero porque
 * esconder o sinal esconderia o motivo de a linha não fechar.
 */
export function linhasPorFuncao(valores: EmendaValores | null | undefined): LinhaFuncao[] {
  if (!valores?.porFuncao) return []
  return Object.entries(valores.porFuncao)
    .map(([funcao, v]) => ({
      funcao,
      empenhado: v.empenhado,
      pago: v.pago,
      emAberto: Math.round((v.empenhado - v.pago) * 100) / 100,
      fracaoPaga: v.empenhado > 0 ? v.pago / v.empenhado : null,
      nEmendas: v.nEmendas,
    }))
    .sort((a, b) => b.empenhado - a.empenhado || a.funcao.localeCompare(b.funcao, 'pt-BR'))
}

/** Percentual com vírgula e uma casa ("91,3%"); `—` sem base de comparação. */
export function formatPercentual(fracao: number | null): string {
  if (fracao === null || Number.isNaN(fracao)) return '—'
  return `${(fracao * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}
