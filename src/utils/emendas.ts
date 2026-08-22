import type { EmendaValores } from '@/types/emendas'

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

/** R$ por extenso, para tooltips e detalhamento onde a precisão importa. */
export function formatReaisCheio(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Anos presentes na quebra anual, em ordem crescente. */
export function anosDe(valores: EmendaValores | null | undefined): string[] {
  if (!valores?.porAno) return []
  return Object.keys(valores.porAno).sort()
}
