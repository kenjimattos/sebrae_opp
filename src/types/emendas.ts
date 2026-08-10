// Contrato de `GET /api/emendas` — emendas parlamentares por município da PB.
//
// Duas esferas com QUALIDADES DIFERENTES de atribuição municipal, e o contrato
// carrega isso de propósito (campo `atribuicao`), para a UI poder rotular:
//
//   federal  → `ibge`: o município vem de um campo estruturado na origem
//              (Portal da Transparência, conjunto por documento de despesa). Exato.
//   estadual → `texto-beneficiario`: a origem (CODATA/CGE-PB) não tem campo de
//              município; ele é inferido do texto livre do objeto da emenda.
//              ESTIMATIVA — não somar ao federal num número único sem ressalva.
//
// Espelha a coleção `emendas` do MongoDB (ver database/setup.mongodb.js) e é o
// mesmo shape servido pelo snapshot estático em public/api-snapshot/emendas.json.

export type EmendaEsfera = 'federal' | 'estadual'

/** Como o município de destino foi determinado. */
export type EmendaAtribuicao = 'ibge' | 'texto-beneficiario'

export interface EmendaValoresAno {
  /** Valor destinado pela emenda. Só no estadual — no federal a origem não publica. */
  valor?: number
  empenhado: number
  pago: number
}

export interface EmendaValores {
  valor?: number
  empenhado: number
  pago: number
  /**
   * Quebra anual. ATENÇÃO: o eixo muda por esfera — no federal é o ano do
   * DOCUMENTO de despesa (quando o dinheiro se moveu, então restos a pagar caem
   * no ano certo); no estadual é a safra da emenda, porque a origem publica a
   * execução agregada, sem data de documento. Ver `criterioQuebraAnual`.
   */
  porAno: Record<string, EmendaValoresAno>
  nEmendas: number
  nAutores: number
}

export interface EmendaMunicipio {
  /** Código IBGE (7 dígitos). */
  id: string
  name: string
  federal: EmendaValores | null
  estadual: EmendaValores | null
}

/** Parcela que não se municipaliza — fica no total do estado, fora dos 223. */
export interface EmendaNaoMunicipalizado {
  valor?: number
  empenhado: number
  pago: number
  nota: string
}

export interface EmendaEsferaMeta {
  /** Safra das emendas consideradas. As duas esferas têm janelas diferentes. */
  janela: { de: number; ate: number }
  atribuicao: EmendaAtribuicao
  /** Texto curto explicando o eixo de `porAno` (difere por esfera). */
  criterioQuebraAnual: string
  source: string
  /** Data da coleta na origem (AAAA-MM-DD). */
  coletadoEm: string
  /** Totais do estado inteiro (municipalizado + o que não se municipaliza). */
  estado: EmendaValores & { naoMunicipalizado: EmendaNaoMunicipalizado }
  /** Fração do valor do estado que foi atribuída a algum município (0–1). */
  coberturaMunicipal: number
}

export interface EmendasData {
  esferas: Record<EmendaEsfera, EmendaEsferaMeta>
  /** Sempre os 223 municípios, na ordem canônica. Esfera sem dado vem `null`. */
  municipios: EmendaMunicipio[]
}
