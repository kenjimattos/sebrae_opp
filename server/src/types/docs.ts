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

// De onde veio a régua. 'fonte' = faixa de classificação publicada pela própria
// fonte do dado (o padrão histórico, e o único até jul/2026). 'relativo-pb' =
// corte por tercil calculado entre os 223 municípios da Paraíba, porque a fonte
// não publica faixa. As duas pintam a mesma cor mas NÃO significam a mesma
// coisa: 'Bom' relativo é "no terço de cima da PB", não "atende a um padrão".
// A UI e o prompt da IA são obrigados a dizer qual é — ver
// `src/data/indicators/status-labels.ts` e `api/_lib/prompts.ts`.
// Ausente = 'fonte' (os 6 seeds oficiais não precisam declarar nada).
export type ThresholdProvenance = 'fonte' | 'relativo-pb'

// Unidade em que os cortes estão expressos, quando NÃO é a unidade exibida.
// Contagem bruta não se compara entre municípios (só mede tamanho: João Pessoa
// tem 19.760 trabalhadores em C&T e a mediana do estado é 3), então esses
// indicadores classificam per capita enquanto o card segue exibindo o bruto.
// Presente => o rótulo da barra leva sufixo de unidade.
export interface ThresholdBasis {
  // Sufixo curto, para caber no rótulo da barra: '/1k hab.'
  unit: string
  // Texto por extenso, para o modal: 'vínculos por 1.000 habitantes'
  label: string
  // Rastro de qual denominador o ETL usou: 'populacao@pib-per-capita:2023'
  denominator: string
}

export type Threshold =
  | {
      kind: 'higher-better'
      success: number
      warning: number
      provenance?: ThresholdProvenance
      basis?: ThresholdBasis
    }
  | {
      kind: 'lower-better'
      success: number
      warning: number
      provenance?: ThresholdProvenance
      basis?: ThresholdBasis
    }
  | {
      kind: 'enum'
      map: Record<string, StatusType>
      provenance?: ThresholdProvenance
    }

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
  // O número na unidade em que a régua RELATIVA classifica. Gravado pelo ETL,
  // que é quem tem os denominadores (população vive em `breakdown.populacao` de
  // `pib-per-capita`, e `breakdown` nem é exposto pela API). Preenchido em todo
  // indicador com `provenance: 'relativo-pb'` — inclusive quando a normalização
  // é a identidade, para que a regra de leitura seja uma só.
  //
  // `null` significa **sem base de comparação**, nunca zero: é como os 109
  // municípios que não emitiram alvará na janela e os 73 sem contrato público a
  // PJ saem do semáforo continuando a exibir o valor. Quem decide isso é o
  // gerador, olhando o próprio breakdown (`semEmissaoAlvara`, `vinculosTotal`).
  normalizedValue?: number | null
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
