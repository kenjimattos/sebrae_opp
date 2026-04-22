export type StatusType = 'success' | 'warning' | 'alert'

export interface Indicador {
  id?: string
  label: string
  valor: string | number
  variacao?: string
  status: StatusType
}

export interface Agenda {
  id: string
  nome: string
  indicadores: Indicador[]
}

export interface BaseEconomicaItem {
  id: string
  label: string
  valor: string
  variacao: string
  icone: string
}

export interface IndicadoresData {
  municipio: string
  agendas: Agenda[]
  baseEconomica: BaseEconomicaItem[]
}

export interface CatalogoIndicador {
  id: string
  label: string
}

export interface CatalogoAgenda {
  id: string
  nome: string
  indicadores: CatalogoIndicador[]
}

export interface CatalogoBaseEconomica {
  id: string
  label: string
  icone: string
}

export interface Catalogo {
  agendas: CatalogoAgenda[]
  baseEconomica: CatalogoBaseEconomica[]
}

export interface BaseEconomicaValor {
  valor: string
  variacao: string
}

export interface ValoresMunicipio {
  municipio: string
  agendas: Record<string, string | number>
  baseEconomica: Record<string, BaseEconomicaValor>
}
