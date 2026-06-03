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
}

export interface Catalog {
  agendas: CatalogAgenda[]
  economicBase: CatalogEconomicBase[]
}

export interface EconomicBaseValue {
  value: string
  variation: string
}

export interface MunicipalityValues {
  municipality: string
  agendas: Record<string, string | number>
  economicBase: Record<string, EconomicBaseValue>
}
