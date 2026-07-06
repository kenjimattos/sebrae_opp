export type StatusType = 'success' | 'warning' | 'alert'

export interface Indicator {
  id?: string
  label: string
  value: string | number
  variation?: string
  status: StatusType
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
  variation: string
  tone?: StatusType
  updatedAt: string
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
}

export interface CatalogAgenda {
  id: string
  name: string
  indicators: CatalogIndicator[]
}

export interface CatalogEconomicBase {
  id: string
  label: string
  updatedAt: string
  unit?: string
}

export interface Catalog {
  agendas: CatalogAgenda[]
  economicBase: CatalogEconomicBase[]
}

export interface EconomicBaseValue {
  value: string
  variation: string
  tone?: StatusType
}

export interface MunicipalityValues {
  municipality: string
  agendas: Record<string, string | number>
  economicBase: Record<string, EconomicBaseValue>
}
