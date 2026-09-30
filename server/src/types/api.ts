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
   * precisão da fonte. `value` é só texto. `null` = sem medida.
   */
  numericValue?: number | null
  /**
   * O mesmo valor na unidade em que a régua relativa classifica (ver
   * `threshold.basis`). Presente só quando `threshold.provenance` é
   * 'relativo-pb'; é ELE que classifica e posiciona o marcador da barra nesses
   * casos. `null` = sem base de comparação (≠ zero) → status 'none'.
   */
  normalizedValue?: number | null
  variation?: RawVariation
  status: StatusType
  // A régua. `provenance` diz se é faixa oficial da fonte ou corte relativo
  // entre os 223 municípios da PB — a UI é obrigada a distinguir as duas. O
  // frontend deriva daqui os rótulos das zonas da barra.
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
  // Ver `Indicator.normalizedValue`. O mapa serve o número normalizado porque é
  // ele que dá a intensidade comparável entre municípios — a contagem bruta só
  // desenharia o mapa da população.
  normalizedValue?: number | null
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

// ---------- grão estadual (GET /api/estado) ----------

// Um ponto da série histórica de um indicador estadual.
export interface StateSeriesPoint {
  referenceYear: string
  value: string
  numericValue: number | null
}

// Indicador estadual como o frontend consome.
//
// Não há `status` nem `threshold`, e a ausência é o contrato: nenhum indicador
// estadual classifica. Não há faixa oficial para nenhum dos 8, e a régua relativa
// do grão municipal não se transplanta — com um valor por indicador não existe
// distribuição para tercilar, e tercilar contra as 27 UFs põe 7 dos 8 na faixa do
// meio, que é um semáforo constante. No lugar da cor, `breakdown.posicao` diz onde
// a UF está entre as 27 e entre as 9 do Nordeste: informação, não classificação.
export interface StateIndicator {
  id: string
  label: string
  unit?: string
  description?: string
  source?: string
  value: string
  numericValue: number | null
  variation?: RawVariation
  referenceYear: string
  breakdown?: Record<string, unknown>
  // Série histórica completa, do ano mais antigo ao mais recente. Vazia nunca:
  // tem ao menos o ponto servido em `value`.
  series: StateSeriesPoint[]
}

export interface StateData {
  uf: string
  name: string
  indicators: StateIndicator[]
}
