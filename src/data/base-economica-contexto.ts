// Descrições dos indicadores da Base Econômica — exibidas no InfoTooltip.
// Chave: label exato definido em `src/data/catalogo.ts` (baseEconomica[].label).
// No futuro, estes textos serão gerados por LLM.

export const baseEconomicaContexto: Record<string, string> = {
  'IDSC - Índice de Desenv. Sustentavel das Cidades':
    'Mede o desempenho do município em relação aos 17 Objetivos de Desenvolvimento Sustentável da ONU. Escala de 0 a 100 — quanto maior, melhor.',
  'IDH-M (2021)':
    'Índice de Desenvolvimento Humano Municipal — combina renda, longevidade e educação numa escala de 0 a 1. Quanto mais próximo de 1, melhor o nível de desenvolvimento humano.',
  'Cobertura Atenção Básica na Saúde':
    'Percentual da população coberta por equipes de Atenção Primária (UBS, Estratégia Saúde da Família). Indica o acesso aos serviços de saúde no município.',
  'IDEB 2023 - Anos Iniciais':
    'Índice de Desenvolvimento da Educação Básica para os anos iniciais (1º ao 5º ano do Ensino Fundamental). Combina fluxo escolar e aprendizagem numa escala de 0 a 10.',
  'IDEB 2023 - Anos Finais':
    'Índice de Desenvolvimento da Educação Básica para os anos finais (6º ao 9º ano do Ensino Fundamental). Combina fluxo escolar e aprendizagem numa escala de 0 a 10.',
  'GINI (2010)':
    'Mede a desigualdade na distribuição de renda. Escala de 0 a 1: zero representa igualdade perfeita e um indica desigualdade máxima.',
  'Remuneração média (2024)':
    'Salário médio dos trabalhadores formais do município (vínculos celetistas), apurado a partir da RAIS/CAGED.',
  'Empresas Ativas (2025)':
    'Total de CNPJs com situação ativa registrados no município, considerando todos os portes e naturezas jurídicas.',
  'PIB per capita (2021)':
    'Produto Interno Bruto do município dividido pela população residente. Indicador médio de geração de riqueza por habitante.',
  'MEI (2025)':
    'Quantidade de Microempreendedores Individuais formalizados no município. Faturamento anual de até R$ 81 mil.',
  'ME (2025)':
    'Quantidade de Microempresas formalizadas no município. Faturamento anual de até R$ 360 mil.',
  'EPP (2025)':
    'Quantidade de Empresas de Pequeno Porte formalizadas no município. Faturamento anual entre R$ 360 mil e R$ 4,8 milhões.',
}
