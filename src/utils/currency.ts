import type { BudgetItem } from '@/types/formulator'

/**
 * Lê um valor digitado pelo gestor em reais. Aceita as formas que aparecem na
 * prática num campo livre: "1.000,50", "1000.50", "1000,50", "R$ 1.000,50".
 * Entrada impossível vira 0 — o campo é livre e o total não pode virar NaN.
 */
export function parseBRL(valor: string): number {
  const cleaned = valor
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const num = parseFloat(cleaned)
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
