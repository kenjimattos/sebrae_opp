import type { BudgetItem } from '@/types/formulator'

// Um ponto sozinho, seguido de uma ou duas casas, é vírgula decimal digitada
// no teclado errado. Milhar em pt-BR exige três casas ("1.500"), então não há
// ambiguidade real: ninguém escreve "1.5" querendo mil e quinhentos.
const PONTO_DECIMAL = /^-?\d+\.\d{1,2}$/

/**
 * Lê um valor digitado pelo gestor em reais. Aceita as formas que aparecem na
 * prática num campo livre: "1.000,50", "1000.50", "1000,50", "R$ 1.000,50".
 * Entrada impossível vira 0 — o campo é livre e o total não pode virar NaN.
 *
 * Com vírgula presente, o padrão é BR sem ambiguidade: vírgula decimal, ponto
 * de milhar. Sem vírgula, o ponto só é milhar quando não puder ser decimal —
 * antes desta regra "1000.50" virava 100050 e "1.5" virava 15, mil vezes e dez
 * vezes o valor digitado, direto na soma do projeto e no PDF.
 */
export function parseBRL(valor: string): number {
  const limpo = valor.replace(/[^\d,.-]/g, '')
  let normalizado: string
  if (limpo.includes(',')) {
    normalizado = limpo.replace(/\./g, '').replace(',', '.')
  } else if (PONTO_DECIMAL.test(limpo)) {
    normalizado = limpo
  } else {
    normalizado = limpo.replace(/\./g, '')
  }
  const num = parseFloat(normalizado)
  return Number.isFinite(num) ? num : 0
}

/** R$ por extenso. `style: 'currency'` já usa 2 casas fixas em pt-BR. */
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

/**
 * Soma das rubricas do orçamento. Mora aqui porque o total aparece em dois
 * lugares — o campo "Valor Total" do StepBudget e o resumo da revisão — e
 * divergir entre eles seria um projeto com dois orçamentos.
 */
export function budgetTotal(items: BudgetItem[]): number {
  return items.reduce((acc, item) => acc + parseBRL(item.value), 0)
}
