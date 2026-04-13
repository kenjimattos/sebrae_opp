export type StatusType = 'success' | 'warning' | 'alert'

export interface Indicador {
  label: string
  valor: string | number
  variacao?: string
  status: StatusType
}

export interface Agenda {
  nome: string
  indicadores: Indicador[]
}

export interface BaseEconomicaItem {
  label: string
  valor: string
  variacao: string
  icone: string
}

export interface Risco {
  titulo: string
  descricao: string
  percentual: number
  tipo: 'alert' | 'warning'
}

export interface IndicadoresData {
  municipio: string
  agendas: Agenda[]
  baseEconomica: BaseEconomicaItem[]
  riscos: Risco[]
}
