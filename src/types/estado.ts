// Contrato de `GET /api/estado` — os indicadores da Paraíba no grão UF.
//
// Espelho de `server/src/types/api.ts` (StateIndicator/StateData). Se mexer aqui,
// mexa lá — e no gerador do snapshot desta branch.
//
// NÃO HÁ `status` NEM `threshold`, E A AUSÊNCIA É O CONTRATO.
// Nenhum indicador estadual classifica, e isso é decisão medida, não pendência:
// não há faixa oficial para nenhum dos 8, e a régua relativa do grão municipal
// não se transplanta — com um valor por indicador não existe distribuição para
// tercilar, e tercilando contra as 27 UFs sete dos oito caem na faixa do meio,
// que é um semáforo constante e portanto inútil.
//
// No lugar da cor vem `breakdown.posicao`: onde a UF está entre as 27 e entre as
// 9 do Nordeste. É comparação, não classificação — a UI pode dizer "19ª de 27",
// mas não deve derivar cor disso.
import type { EconomicVariation } from '@/types/indicators'

// Um ponto da série histórica. A série existe onde a fonte tem série: RAIS
// 2016–2025, população 2001–2025, ENEM 2017–2024, matrículas 2018–2024. Já
// `uf-empresas-ativas` é um retrato de estoque e tem um ponto só.
export interface StateSeriesPoint {
  referenceYear: string
  value: string
  numericValue: number | null
}

export interface StateIndicator {
  id: string
  label: string
  unit?: string
  description?: string
  source?: string
  // Valor de exibição já formatado em padrão BR pelo ETL (ex.: "914.955").
  value: string
  numericValue: number | null
  // Objeto estruturado (ou '' quando não há), igual a `EconomicBaseItem.variation`.
  variation?: EconomicVariation | string | null
  referenceYear: string
  // Distribuição por categoria (setor, porte) e `posicao`. Shape aberto de
  // propósito: cada indicador guarda o que a sua fonte permite, e o contrato não
  // tem como prometer as mesmas chaves para os 8.
  breakdown?: Record<string, unknown>
  // Nunca vazia: traz ao menos o ponto servido em `value`.
  series: StateSeriesPoint[]
}

export interface StateData {
  // Código IBGE da UF. '25' = Paraíba.
  uf: string
  name: string
  indicators: StateIndicator[]
}
