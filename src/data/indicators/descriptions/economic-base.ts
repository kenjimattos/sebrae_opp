// Descrições dos indicadores da Base Econômica — exibidas no InfoTooltip.
// Chave: id em `src/data/indicators/catalog.ts` (economicBase[].id).
// Id é estável; renomear o `label` no catálogo não quebra o lookup.
// No futuro, estes textos serão gerados por LLM.

export const economicBaseDescriptions: Record<string, string> = {
  idsc:
    'Índice de Desenvolvimento Sustentável das Cidades.Mede o desempenho do município em relação aos 17 Objetivos de Desenvolvimento Sustentável da ONU. Escala de 0 a 100 — quanto maior, melhor.',
  'idh-m':
    'Índice de Desenvolvimento Humano Municipal — combina renda, longevidade e educação numa escala de 0 a 1. Quanto mais próximo de 1, melhor o nível de desenvolvimento humano.',
  'cobertura-atencao-basica':
    'Percentual da população coberta por equipes de Atenção Primária (UBS, Estratégia Saúde da Família). Indica o acesso aos serviços de saúde no município.',
  'ideb-anos-iniciais':
    'Índice de Desenvolvimento da Educação Básica para os anos iniciais (1º ao 5º ano do Ensino Fundamental). Combina fluxo escolar e aprendizagem numa escala de 0 a 10.',
  'ideb-anos-finais':
    'Índice de Desenvolvimento da Educação Básica para os anos finais (6º ao 9º ano do Ensino Fundamental). Combina fluxo escolar e aprendizagem numa escala de 0 a 10.',
  gini:
    'Mede a desigualdade na distribuição de renda. Escala de 0 a 1: zero representa igualdade perfeita e um indica desigualdade máxima.',
  'remuneracao-media':
    'Salário médio dos trabalhadores formais do município (vínculos celetistas), apurado a partir da RAIS/CAGED.',
  'empresas-ativas-total':
    'Total de CNPJs com situação ativa registrados no município, considerando todos os portes e naturezas jurídicas.',
  'pib-per-capita':
    'Produto Interno Bruto do município dividido pela população residente. Indicador médio de geração de riqueza por habitante.',
  meis:
    'Quantidade de Microempreendedores Individuais formalizados no município. Faturamento anual de até R$ 81 mil.',
  mes:
    'Quantidade de Microempresas formalizadas no município. Faturamento anual de até R$ 360 mil.',
  epps:
    'Quantidade de Empresas de Pequeno Porte formalizadas no município. Faturamento anual entre R$ 360 mil e R$ 4,8 milhões.',
}
