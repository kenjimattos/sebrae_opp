// Documentos como vivem no MongoDB (coleções do DadosOPP) e o vocabulário
// compartilhado entre banco e contrato.
//
// Este arquivo muda quando o **ETL** muda o shape gravado — ver
// `database/setup.mongodb.js`, que valida o mesmo schema do lado do banco.
// O que o frontend consome fica em `api.ts`, que muda por outro motivo.

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

export type EmendaEsfera = 'federal' | 'estadual'

// Como o município de destino foi determinado. 'ibge' = campo estruturado na
// origem (federal, exato); 'texto-beneficiario' = inferido do texto livre do
// objeto da emenda (estadual, ESTIMATIVA — a UI rotula como tal).
export type EmendaAtribuicao = 'ibge' | 'texto-beneficiario'

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
