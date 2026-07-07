// 'none' = indicador sem faixa de classificação oficial (sem semáforo). Só os
// 6 indicadores de agenda cuja fonte publica faixa recebem success/warning/alert;
// os demais ficam 'none' → não mostram IndicatorBar. A cor de agenda também é
// neutralizada (agregado não tem faixa oficial). Ver database/MAPEAMENTO_BASE_DOS_DADOS.md.
export type StatusType = 'success' | 'warning' | 'alert' | 'none'

// Faixa oficial de classificação de um indicador (só os 6 com fonte publicando
// classificação). Vem da API (indicators.threshold no banco). O frontend a usa
// para rotular as zonas do IndicatorBar. Ausente = sem semáforo ('none').
export interface IndicatorThreshold {
  kind: 'higher-better' | 'lower-better' | 'enum'
  success?: number
  warning?: number
}

// Variação de um indicador vinda do ETL/banco: objeto estruturado com o delta
// percentual e o ponto de comparação. Indicadores sem variação chegam como
// string vazia (contrato legado do servidor) — normalizar com `toEconomicVariation`.
export interface EconomicVariation {
  deltaPct: number
  previousValue: number
  previousYear: string
  // Base de comparação usada pelo ETL: 'edicao-anterior' | 'yoy' | 'yoy-media-anual' | ...
  basis: string
}

export interface Indicator {
  id?: string
  label: string
  value: string | number
  variation?: EconomicVariation | string | null
  status: StatusType
  threshold?: IndicatorThreshold
}

export interface Agenda {
  id: string
  name: string
  indicators: Indicator[]
}

export interface EconomicBaseItem {
  id: string
  label: string
  value: string
  // Objeto estruturado (ou '' quando não há variação). Ver `EconomicVariation`.
  variation?: EconomicVariation | string | null
  tone?: StatusType
  referenceYear: string
}

export interface IndicatorsData {
  municipality: string
  agendas: Agenda[]
  economicBase: EconomicBaseItem[]
}

export interface CatalogIndicator {
  id: string
  label: string
  // Unidade/escala canônica para exibição (ex: "h", "%", "R$", "índice (0–10)").
  // Alinhada às definições em database/MAPEAMENTO_BASE_DOS_DADOS.md e ao contrato
  // da futura API. Ano de referência não vive aqui.
  unit?: string
  // `false` = indicador ainda NÃO implementado (sem seed/fonte no banco) → não
  // aparece na plataforma. Default (ausente) = implementado. Quando a API existir,
  // isso vem do próprio banco (indicador sem dado simplesmente não é retornado).
  implemented?: boolean
}

export interface CatalogAgenda {
  id: string
  name: string
  indicators: CatalogIndicator[]
}

export interface CatalogEconomicBase {
  id: string
  label: string
  referenceYear: string
  unit?: string
  // idem CatalogIndicator: `false` oculta o card até ser implementado.
  implemented?: boolean
}

export interface Catalog {
  agendas: CatalogAgenda[]
  economicBase: CatalogEconomicBase[]
}

export interface EconomicBaseValue {
  value: string
  variation?: EconomicVariation | string | null
  tone?: StatusType
}

export interface MunicipalityValues {
  municipality: string
  agendas: Record<string, string | number>
  economicBase: Record<string, EconomicBaseValue>
}
