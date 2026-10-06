// Leitores do `breakdown` dos indicadores estaduais.
//
// `StateIndicator.breakdown` é `Record<string, unknown>` de propósito: cada
// fonte guarda o que consegue, e o contrato não promete as mesmas chaves para os
// 8 indicadores (ver src/types/estado.ts). Quem lê precisa de type guard — daí
// este arquivo, e não um cast no componente.

/**
 * Posição da UF entre pares. É COMPARAÇÃO, NÃO CLASSIFICAÇÃO: nenhum indicador
 * estadual tem `threshold`, e a UI não deve derivar cor daqui (ver CLAUDE.md).
 */
export interface StatePosition {
  entreUfs: number
  totalUfs: number
  entreNordeste: number
  totalNordeste: number
  // Quando `true`, a posição foi calculada per capita e `valorNormalizado` traz
  // o número que de fato ordenou — que não é o exibido no card. A tela avisa que
  // a ordem é per capita, mas não mostra esse número.
  normalizado: boolean
  valorNormalizado: number | null
  unidadeNormalizada: string
}

/** Uma fatia de uma distribuição (`porSetor`, `porFaixa`, `porArea`…). */
export interface StateSlice {
  label: string
  value: number
}

function record(raw: unknown): Record<string, unknown> | null {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null
}

function num(raw: unknown): number | null {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null
}

export function readPosition(breakdown?: Record<string, unknown>): StatePosition | null {
  const p = record(breakdown?.posicao)
  if (!p) return null
  const entreUfs = num(p.entreUfs)
  const totalUfs = num(p.totalUfs)
  if (entreUfs === null || totalUfs === null) return null
  return {
    entreUfs,
    totalUfs,
    entreNordeste: num(p.entreNordeste) ?? 0,
    totalNordeste: num(p.totalNordeste) ?? 0,
    normalizado: p.normalizado === true,
    valorNormalizado: num(p.valorNormalizado),
    unidadeNormalizada: typeof p.unidadeNormalizada === 'string' ? p.unidadeNormalizada : '',
  }
}

/**
 * Lê uma distribuição do breakdown e devolve as fatias em ordem decrescente.
 * Descarta chave sem valor numérico — o gráfico não inventa zero para o que a
 * fonte não mediu.
 */
export function readDistribution(
  breakdown: Record<string, unknown> | undefined,
  key: string,
): StateSlice[] {
  const dist = record(breakdown?.[key])
  if (!dist) return []
  const slices: StateSlice[] = []
  for (const [label, raw] of Object.entries(dist)) {
    const value = num(raw)
    if (value !== null) slices.push({ label, value })
  }
  return slices.sort((a, b) => b.value - a.value)
}

/** Número solto do breakdown (um total de referência, uma contagem). */
export function readNumber(
  breakdown: Record<string, unknown> | undefined,
  key: string,
): number | null {
  return num(breakdown?.[key])
}

/** Inteiro em pt-BR; decimais só quando o número os tem. */
export function formatNumberBR(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

/** Ordinal feminino — "19ª". UF, posição e colocação são todas femininas. */
export function ordinalF(n: number): string {
  return `${n}ª`
}
