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
  // Metadados por indicador (ETL). `confiabilidade` marca a robustez da
  // amostra (ex.: tempos Redesim: 'alta' n≥30, 'baixa' n<30, 'sem-dados' n=0).
  // Quando != 'alta' o valor é suprimido na API (ver isLowConfidence).
  breakdown?: {
    confiabilidade?: 'alta' | 'baixa' | 'sem-dados'
    n?: number
    [key: string]: unknown
  }
}

export interface MunicipalityDoc {
  _id: string
  name: string
  slug: string
}

// Emendas parlamentares por município × esfera. Fica fora de indicatorValues de
// propósito: não é indicador de agenda (sem threshold/semáforo) e o shape é outro.
// 224 docs por esfera — 223 municípios (`escopo: 'municipio'`) + 1 rollup do
// estado (`escopo: 'estado'`, _id 'PB:<esfera>'), que é onde vivem os metadados
// da esfera (janela, coletadoEm, criterioQuebraAnual, naoMunicipalizado).
export interface EmendaDoc {
  _id: string
  escopo: 'municipio' | 'estado'
  municipalityId?: string | null
  esfera: EmendaEsfera
  // Só no estadual: a origem publica o valor aprovado à parte da execução. No
  // federal não existe — lá só há empenhado/pago.
  valor?: number
  empenhado: number
  pago: number
  porAno?: Record<string, { valor?: number; empenhado: number; pago: number }>
  // Só em escopo='estado'.
  naoMunicipalizado?: {
    valor?: number
    empenhado: number
    pago: number
    nota: string
  }
  nEmendas?: number
  nAutores?: number
  janela?: { de: number; ate: number }
  atribuicao?: EmendaAtribuicao
  // Metadados da esfera, gravados só no doc de escopo estadual.
  coletadoEm?: string
  criterioQuebraAnual?: string
  referenceYear: string
  source?: string | null
  isFictional: boolean
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
// Espelha src/types/emendas.ts no frontend. Se mexer num, mexa nos dois.

export type EmendaEsfera = 'federal' | 'estadual'

// Como o município de destino foi determinado. 'ibge' = campo estruturado na
// origem (federal, exato); 'texto-beneficiario' = inferido do texto livre do
// objeto da emenda (estadual, ESTIMATIVA — a UI rotula como tal).
export type EmendaAtribuicao = 'ibge' | 'texto-beneficiario'

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
