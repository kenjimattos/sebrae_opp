// Shape do rascunho de um projeto no Formulador.
// Persistido em localStorage por município.

// Nota: `municipio` não está aqui — é a fonte de verdade do MunicipioProvider
// (CitySelector na home + Dropdown na etapa Identificação apontam para o mesmo estado).
export interface IdentificacaoData {
  titulo: string
  responsavel: string
  orgao: string
  duracao: string
}

export interface JustificativaData {
  problema: string
  evidencias: string
  impacto: string
}

export interface ObjetivosData {
  geral: string
  especificos: string[]
}

export interface PublicoAlvoData {
  principal: string
  secundario: string
  estimativa: string
}

export interface PlanoAcaoData {
  atividades: string
  metodologia: string
}

export interface CronogramaData {
  fases: string
  marcos: string
}

export interface IndicadoresData {
  resultado: string[]
  impacto: string[]
  quantitativas: string[]
}

export interface RubricaOrcamento {
  label: string
  valor: string
}

export interface OrcamentoData {
  rubricas: RubricaOrcamento[]
}

export interface SustentabilidadeData {
  continuidade: string
  parcerias: string
}

export interface GovernancaData {
  gestao: string
  monitoramento: string
  prestacaoContas: string
}

export interface FormuladorState {
  identificacao: IdentificacaoData
  justificativa: JustificativaData
  objetivos: ObjetivosData
  publicoAlvo: PublicoAlvoData
  planoAcao: PlanoAcaoData
  cronograma: CronogramaData
  indicadores: IndicadoresData
  orcamento: OrcamentoData
  sustentabilidade: SustentabilidadeData
  governanca: GovernancaData
  etapasVisitadas: string[]
}

export const EMPTY_FORMULADOR_STATE: FormuladorState = {
  identificacao: { titulo: '', responsavel: '', orgao: '', duracao: '' },
  justificativa: { problema: '', evidencias: '', impacto: '' },
  objetivos: { geral: '', especificos: [''] },
  publicoAlvo: { principal: '', secundario: '', estimativa: '' },
  planoAcao: { atividades: '', metodologia: '' },
  cronograma: { fases: '', marcos: '' },
  indicadores: { resultado: ['', '', ''], impacto: ['', '', ''], quantitativas: ['', '', ''] },
  orcamento: { rubricas: [{ label: '', valor: '' }] },
  sustentabilidade: { continuidade: '', parcerias: '' },
  governanca: { gestao: '', monitoramento: '', prestacaoContas: '' },
  etapasVisitadas: [],
}
