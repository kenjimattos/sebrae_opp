// Contrato da API. Espelha src/types/indicators.ts do frontend: os endpoints
// devolvem exatamente o shape que o MunicipalityProvider hoje monta a partir dos
// TS estáticos, para que a troca no frontend seja mínima.

export type StatusType = 'success' | 'warning' | 'alert' | 'none'

// Variação de um indicador como o ETL grava no banco: objeto estruturado com o
// delta percentual e o ponto de comparação. Indicadores sem variação chegam como
// string vazia (contrato legado). Espelha `EconomicVariation` do frontend
// (src/types/indicators.ts).
export interface EconomicVariation {
  deltaPct: number
  previousValue: number
  previousYear: string
  basis: string
}

// Valor cru de `variation` como sai do banco / vai pra API.
export type RawVariation = EconomicVariation | string | null

// --- Documentos como vivem no MongoDB (coleções do DadosOPP) ---

export type Threshold =
  | { kind: 'higher-better'; success: number; warning: number }
  | { kind: 'lower-better'; success: number; warning: number }
  | { kind: 'enum'; map: Record<string, StatusType> }

export interface Placement {
  section: 'agenda' | 'socialeconomic'
  agendaId?: string
  order?: number
}

export interface AgendaDoc {
  _id: string
  name: string
  order: number
}

export interface IndicatorDoc {
  _id: string
  label: string
  threshold?: Threshold
  referenceYear?: string
  unit?: string
  description?: string
  source?: string
  placements: Placement[]
}

export interface IndicatorValueDoc {
  municipalityId: string
  indicatorId: string
  rawValue: string
  numericValue?: number | null
  variation?: RawVariation
  referenceYear: string
  isFictional: boolean
}

export interface MunicipalityDoc {
  _id: string
  name: string
  slug: string
}

// --- Respostas da API (o que o frontend consome) ---

export interface MunicipalitySummary {
  id: string
  name: string
  slug: string
}

export interface Indicator {
  id: string
  label: string
  value: string
  variation?: RawVariation
  status: StatusType
  // Faixa oficial (só nos 6 indicadores classificados). O frontend deriva os
  // rótulos das zonas da barra a partir daqui.
  threshold?: Threshold
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
  variation?: RawVariation
  referenceYear: string
}

export interface IndicatorsData {
  municipality: string
  agendas: Agenda[]
  economicBase: EconomicBaseItem[]
}

export interface MapIndicatorEntry {
  value: string
  numericValue?: number
  status: StatusType
}

export interface MapMunicipality {
  name: string
  indicators: Record<string, MapIndicatorEntry>
}

export interface MapOption {
  label: string
  shortLabel: string
  value: string
}

export interface MapData {
  options: MapOption[]
  municipalities: Record<string, MapMunicipality>
}
