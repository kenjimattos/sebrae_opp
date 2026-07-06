// Contextos de risco para indicadores em alerta/atenção.
// Chave: id do indicador em `src/data/indicators/catalog.ts` (indicators[].id).
// Id é estável; renomear o `label` no catálogo não quebra o lookup.
// No futuro, essas descrições podem ser geradas por LLM.

interface RiskContext {
  description: string
  indicatorLabel: string
  context: string
}

export const risksContext: Record<string, RiskContext> = {
  // Governança
  'igm-cfa': {
    description: 'Governança municipal com lacunas em transparência e participação social',
    indicatorLabel: 'Atenção',
    context: 'Score abaixo de 7,0 indica necessidade de fortalecimento institucional',
  },
  'isdel-governanca': {
    description: 'Índice abaixo do limiar mínimo de sustentabilidade econômica local',
    indicatorLabel: 'Alerta',
    context: 'Municípios com ISDEL abaixo de 0,5 tendem a ter maior dependência de transferências federais',
  },
  igma: {
    description: 'Gestão municipal com baixa maturidade institucional e processos fragmentados',
    indicatorLabel: 'Atenção',
    context: 'IGMA abaixo de 0,55 indica necessidade de fortalecer planejamento e execução',
  },
  // Simplificação
  'tempo-viabilidade': {
    description: 'Burocracia acima da média estadual impacta abertura de novos negócios',
    indicatorLabel: 'Atenção',
    context: 'Meta Redesim é reduzir para 15 dias até 2026',
  },
  'ranking-redesim': {
    description: 'Integração parcial com a rede nacional de simplificação',
    indicatorLabel: 'Atenção',
    context: 'Municípios com integração total têm 40% mais abertura de empresas',
  },
  'tempo-licenciamento': {
    description: 'Prazo de licenciamento impacta investimentos de médio porte',
    indicatorLabel: 'Atenção',
    context: 'Benchmark regional é de 10 dias para licenças de baixo risco',
  },
  // Inovação
  'trabalhadores-tic': {
    description: 'Baixa representatividade da economia criativa no mercado formal',
    indicatorLabel: 'Atenção',
    context: 'Média nacional é de 5,8% dos trabalhadores formais',
  },
  'crescimento-mpe': {
    description: 'Baixo crescimento de formalização nos Ecossistemas Locais de Inovação',
    indicatorLabel: 'Atenção',
    context: 'Meta estadual é atingir crescimento de +10% a.a. até 2027',
  },
  'compras-publicas-inovacao': {
    description: 'Compras públicas de inovação insuficientes para movimentar MPE locais',
    indicatorLabel: 'Atenção',
    context: 'Lei Complementar 123 prevê tratamento diferenciado para MPE em licitações',
  },
  // Educação empreendedora
  'isdel-educacao-emp': {
    description: 'Cobertura limitada de educação empreendedora na rede escolar',
    indicatorLabel: 'Atenção',
    context: 'Meta estadual é atingir subdimensão ISDEL acima de 0,6 até 2027',
  },
  'trabalhadores-superior-completo': {
    description: 'Baixa qualificação da força de trabalho formal no município',
    indicatorLabel: 'Alerta',
    context: 'Municípios com menos de 20% tendem a ter menor inserção em cadeias de valor',
  },
  // Financiamento e crédito
  'credito-financiamento': {
    description: 'Volume de crédito concedido limitado restringe investimentos produtivos',
    indicatorLabel: 'Alerta',
    context: 'Acesso a crédito orientado é fator crítico para sobrevivência de MPE',
  },
  'bndes-operacoes': {
    description: 'Operações estruturadas de financiamento incipientes no município',
    indicatorLabel: 'Atenção',
    context: 'FAMPE e linhas BNDES disponíveis exigem articulação local para execução',
  },
  // Inclusão produtiva
  'negocios-abertos': {
    description: 'Taxa de sobrevivência de novos negócios precisa ser monitorada',
    indicatorLabel: 'Atenção',
    context: 'Relação abertos/extintos de 1,39 está abaixo da média estadual de 1,8',
  },
  'negocios-extintos': {
    description: 'Vulnerabilidade a choques setoriais e ciclos de dependência fiscal',
    indicatorLabel: 'Alerta',
    context: '72% da atividade econômica concentrada em 3 setores',
  },
  'bolsa-familia': {
    description: 'Aumento de beneficiários em idade produtiva sinaliza deterioração do mercado',
    indicatorLabel: 'Alerta',
    context: 'Crescimento acima de 5% a.a. indica piora na inserção produtiva da população adulta',
  },
  'apoiados-sebrae': {
    description: 'Cobertura limitada do apoio Sebrae à base empresarial local',
    indicatorLabel: 'Atenção',
    context: 'Municípios com cobertura abaixo de 10% da base ativa subutilizam o suporte disponível',
  },
  'mpe-compras-publicas': {
    description: 'Participação das MPE nas compras públicas aquém do potencial',
    indicatorLabel: 'Atenção',
    context: 'Benchmark nacional é de 25% do valor total de compras públicas para MPE',
  },
  'linhas-credito': {
    description: 'Poucas linhas de crédito operacionais no município para MPE',
    indicatorLabel: 'Atenção',
    context: 'Ampliar convênios com agentes financeiros e cooperativas pode elevar acesso',
  },
}

// Fallback para indicadores sem contexto cadastrado
export const defaultRiskContext: RiskContext = {
  description: 'Indicador requer atenção e acompanhamento contínuo',
  indicatorLabel: 'Atenção',
  context: 'Valor abaixo da referência esperada para o município',
}
