// Rótulos do bloco de análise do modo "Panorâma Sócioeconômico".
//
// O texto da análise NÃO mora aqui: é gerado pela IA (task `economic-analysis`),
// com os cards da base econômica do município como única fonte de números.
// Até então havia um Record<IBGE, string> com análises escritas à mão para 8 dos
// 223 municípios — os outros 215 recebiam um parágrafo genérico idêntico, e os
// valores citados no texto eram fixos no código: o de Campina Grande dizia
// "R$ 2.400" de remuneração média (real: R$ 2.770,62) e "12.840" empresas ativas
// (real: 26.911), contradizendo os cards exibidos alguns pixels acima.

export const analysisLabel = 'Análise' as const

export const emptyAnalysisTitle = 'Análise de desempenho do município' as const
export const emptyAnalysisSubtitle =
  'Gere uma leitura personalizada dos indicadores do município, com destaques, riscos e oportunidades identificadas por IA.' as const
export const generateAnalysisLabel = 'Gerar análise com IA' as const
export const regenerateAnalysisLabel = 'Gerar novamente' as const
export const generatingAnalysisLabel = 'Analisando indicadores…' as const
