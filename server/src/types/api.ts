// Contrato da API — o que o frontend consome. Espelha `src/types/indicators.ts`
// e `src/types/emendas.ts`: os endpoints devolvem exatamente o shape que o
// `MunicipalityProvider` montava a partir dos TS estáticos.
//
// **Se mexer aqui, mexa no espelho do frontend.** Este arquivo muda com a UI; o
// shape gravado pelo ETL é outro arquivo (`docs.ts`) e muda por outro motivo.
//
// O vocabulário comum aos dois (StatusType, Threshold, RawVariation, esferas de
// emenda) mora em `docs.ts` e é importado aqui — não reexportado, senão o
// `index.ts` teria o mesmo nome saindo por dois caminhos.
import type {
  EmendaAtribuicao,
  EmendaEsfera,
  RawVariation,
  StatusType,
  Threshold,
} from './docs.js'

export interface MunicipalitySummary {
  id: string
  name: string
  slug: string
}

export interface Indicator {
  id: string
  label: string
  /** Valor de exibição (padrão BR, com unidade, arredondado). */
  value: string
  /**
   * O mesmo valor como número, direto do ETL — sem locale, sem unidade, na
   * precisão da fonte. É o que classifica e o que posiciona o marcador da
   * barra; `value` é só texto. `null` = sem medida.
   */
  numericValue?: number | null
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

// --- GET /api/emendas ---

export interface EmendaValoresAno {
  valor?: number
  empenhado: number
  pago: number
}

export interface EmendaValores {
  valor?: number
  empenhado: number
  pago: number
  // ATENÇÃO: o eixo muda por esfera — federal é o ano do DOCUMENTO de despesa,
  // estadual é a safra da emenda. Ver `criterioQuebraAnual`.
  porAno: Record<string, EmendaValoresAno>
  nEmendas: number
  nAutores: number
}

export interface EmendaMunicipio {
  id: string
  name: string
  federal: EmendaValores | null
  estadual: EmendaValores | null
}

export interface EmendaNaoMunicipalizado {
  valor?: number
  empenhado: number
  pago: number
  nota: string
}

export interface EmendaEsferaMeta {
  janela: { de: number; ate: number }
  atribuicao: EmendaAtribuicao
  criterioQuebraAnual: string
  source: string
  coletadoEm: string
  estado: EmendaValores & { naoMunicipalizado: EmendaNaoMunicipalizado }
  coberturaMunicipal: number
}

export interface EmendasData {
  esferas: Record<EmendaEsfera, EmendaEsferaMeta>
  // Sempre os 223 municípios, em ordem alfabética. Esfera sem dado vem `null`.
  municipios: EmendaMunicipio[]
}
