// 'none' = indicador sem régua (sem semáforo) → não mostra IndicatorBar.
// Hoje 17 dos 22 indicadores de agenda classificam: 6 por faixa oficial da fonte
// e 11 por tercil entre os 223 municípios da PB. Os 5 restantes ficam 'none'
// porque a distribuição não separa ou a direção é ambígua — ver a tabela em
// database/MAPEAMENTO_BASE_DOS_DADOS.md, §Semáforo.
export type StatusType = 'success' | 'warning' | 'alert' | 'none'

// De onde veio a régua. As duas pintam a mesma cor e NÃO significam a mesma
// coisa: 'Bom' oficial é "atende ao padrão da fonte"; 'Bom' relativo é "está no
// terço de cima da Paraíba". Apresentar o segundo como o primeiro é o motivo
// pelo qual a cor de agenda ficou desligada — por isso a procedência é dita na
// tela (IndicatorModal) e mandada à IA. Ausente = 'fonte'.
export type ThresholdProvenance = 'fonte' | 'relativo-pb'

// Unidade dos cortes quando NÃO é a unidade exibida. Contagem bruta não compara
// municípios (mede o tamanho deles), então esses indicadores classificam per
// capita enquanto o card exibe o bruto. Presente ⇒ o rótulo da barra leva sufixo.
export interface ThresholdBasis {
  unit: string
  label: string
  denominator: string
}

// A régua de um indicador. Vem da API (indicators.threshold no banco). O
// frontend a usa para rotular as zonas do IndicatorBar e para dizer a
// procedência. Ausente = sem semáforo ('none').
export interface IndicatorThreshold {
  kind: 'higher-better' | 'lower-better' | 'enum'
  success?: number
  warning?: number
  provenance?: ThresholdProvenance
  basis?: ThresholdBasis
}

// Variação de um indicador vinda do ETL/banco: objeto estruturado com o delta
// percentual e o ponto de comparação. Indicadores sem variação chegam como
// string vazia (contrato legado do servidor) — normalizar com `toEconomicVariation`.
export interface EconomicVariation {
  deltaPct: number
  previousValue: number
  previousYear: string
  // Base de comparação usada pelo ETL: 'edicao-anterior' | 'yoy' | 'yoy-media-anual' | ...
  basis: string
}

export interface Indicator {
  id?: string
  label: string
  /** Valor de exibição (padrão BR, com unidade, arredondado). */
  value: string | number
  /**
   * O mesmo valor como número, direto do ETL — sem locale, sem unidade, na
   * precisão da fonte. `null` = sem medida.
   */
  numericValue?: number | null
  /**
   * O mesmo valor na unidade em que a régua relativa classifica (ver
   * `threshold.basis`). Quando existe, é ELE que classifica e posiciona o
   * marcador — não o bruto. `null` = sem base de comparação (≠ zero).
   * Use `classifiedValue()` em vez de ler este campo direto.
   */
  normalizedValue?: number | null
  variation?: EconomicVariation | string | null
  status: StatusType
  threshold?: IndicatorThreshold
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
  // Objeto estruturado (ou '' quando não há variação). Ver `EconomicVariation`.
  variation?: EconomicVariation | string | null
  referenceYear: string
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
  // `false` = indicador ainda NÃO implementado (sem seed/fonte no banco) → não
  // aparece na plataforma. Default (ausente) = implementado. Quando a API existir,
  // isso vem do próprio banco (indicador sem dado simplesmente não é retornado).
  implemented?: boolean
}

export interface CatalogAgenda {
  id: string
  name: string
  indicators: CatalogIndicator[]
}

export interface CatalogEconomicBase {
  id: string
  label: string
  referenceYear: string
  unit?: string
  // idem CatalogIndicator: `false` oculta o card até ser implementado.
  implemented?: boolean
}

export interface Catalog {
  agendas: CatalogAgenda[]
  economicBase: CatalogEconomicBase[]
}

export interface EconomicBaseValue {
  value: string
  variation?: EconomicVariation | string | null
}
