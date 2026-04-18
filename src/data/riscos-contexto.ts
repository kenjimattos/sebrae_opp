// Contextos de risco para indicadores em alerta/atenção
// Chave: label do indicador (match exato com os JSONs de agendas)
// No futuro, essas descrições podem ser geradas por LLM

interface RiscoContexto {
  descricao: string
  indicadorLabel: string
  contexto: string
}

export const riscosContexto: Record<string, RiscoContexto> = {
  // Governança
  'IGM – Índice CFA de Governança Municipal (Finanças, Gestão e Desempenho) 2025': {
    descricao: 'Governança municipal com lacunas em transparência e participação social',
    indicadorLabel: 'Atenção',
    contexto: 'Score abaixo de 7,0 indica necessidade de fortalecimento institucional',
  },
  'Governança para o Desenvolvimento – ISDEL 2023': {
    descricao: 'Índice abaixo do limiar mínimo de sustentabilidade econômica local',
    indicadorLabel: 'Alerta',
    contexto: 'Municípios com ISDEL abaixo de 0,5 tendem a ter maior dependência de transferências federais',
  },
  'Índice de Gestão Municipal Áquila (IGMA)': {
    descricao: 'Gestão municipal com baixa maturidade institucional e processos fragmentados',
    indicadorLabel: 'Atenção',
    contexto: 'IGMA abaixo de 0,55 indica necessidade de fortalecer planejamento e execução',
  },
  // Simplificação
  'Tempo médio de viabilidade da empresa (h) em relação à média estadual': {
    descricao: 'Burocracia acima da média estadual impacta abertura de novos negócios',
    indicadorLabel: 'Atenção',
    contexto: 'Meta Redesim é reduzir para 15 dias até 2026',
  },
  'Ranking municipal Redesim/PB': {
    descricao: 'Integração parcial com a rede nacional de simplificação',
    indicadorLabel: 'Atenção',
    contexto: 'Municípios com integração total têm 40% mais abertura de empresas',
  },
  'Tempo de licenciamento': {
    descricao: 'Prazo de licenciamento impacta investimentos de médio porte',
    indicadorLabel: 'Atenção',
    contexto: 'Benchmark regional é de 10 dias para licenças de baixo risco',
  },
  // Inovação
  'Trabalhadores nos setores da economia criativa, inovação e TIC': {
    descricao: 'Baixa representatividade da economia criativa no mercado formal',
    indicadorLabel: 'Atenção',
    contexto: 'Média nacional é de 5,8% dos trabalhadores formais',
  },
  'Taxa de crescimento de MPE formalizadas nos ELI com apoio Sebrae': {
    descricao: 'Baixo crescimento de formalização nos Ecossistemas Locais de Inovação',
    indicadorLabel: 'Atenção',
    contexto: 'Meta estadual é atingir crescimento de +10% a.a. até 2027',
  },
  'Taxa de crescimento do valor das compras públicas de inovação nos pequenos negócios': {
    descricao: 'Compras públicas de inovação insuficientes para movimentar MPE locais',
    indicadorLabel: 'Atenção',
    contexto: 'Lei Complementar 123 prevê tratamento diferenciado para MPE em licitações',
  },
  // Educação empreendedora
  'Subdimensão Educação Empreendedora, da dimensão Capital Empreendedor – ISDEL': {
    descricao: 'Cobertura limitada de educação empreendedora na rede escolar',
    indicadorLabel: 'Atenção',
    contexto: 'Meta estadual é atingir subdimensão ISDEL acima de 0,6 até 2027',
  },
  'Trabalhadores formais com pelo menos o Ensino Superior Completo': {
    descricao: 'Baixa qualificação da força de trabalho formal no município',
    indicadorLabel: 'Alerta',
    contexto: 'Municípios com menos de 20% tendem a ter menor inserção em cadeias de valor',
  },
  // Financiamento e crédito
  'Valor (R$) das operações de crédito e de financiamento concedidos no município': {
    descricao: 'Volume de crédito concedido limitado restringe investimentos produtivos',
    indicadorLabel: 'Alerta',
    contexto: 'Acesso a crédito orientado é fator crítico para sobrevivência de MPE',
  },
  'Valor (R$) total das Operações diretas e indiretas não automáticas (financiamento e crédito)': {
    descricao: 'Operações estruturadas de financiamento incipientes no município',
    indicadorLabel: 'Atenção',
    contexto: 'FAMPE e linhas BNDES disponíveis exigem articulação local para execução',
  },
  // Inclusão produtiva
  'Total de pequenos negócios abertos': {
    descricao: 'Taxa de sobrevivência de novos negócios precisa ser monitorada',
    indicadorLabel: 'Atenção',
    contexto: 'Relação abertos/extintos de 1,39 está abaixo da média estadual de 1,8',
  },
  'Total de pequenos negócios extintos no período': {
    descricao: 'Vulnerabilidade a choques setoriais e ciclos de dependência fiscal',
    indicadorLabel: 'Alerta',
    contexto: '72% da atividade econômica concentrada em 3 setores',
  },
  'Taxa de crescimento anual de beneficiários do Bolsa Família entre 18 e 50 anos': {
    descricao: 'Aumento de beneficiários em idade produtiva sinaliza deterioração do mercado',
    indicadorLabel: 'Alerta',
    contexto: 'Crescimento acima de 5% a.a. indica piora na inserção produtiva da população adulta',
  },
  'Número de pequenos negócios apoiados pelo Sebrae': {
    descricao: 'Cobertura limitada do apoio Sebrae à base empresarial local',
    indicadorLabel: 'Atenção',
    contexto: 'Municípios com cobertura abaixo de 10% da base ativa subutilizam o suporte disponível',
  },
  '% dos pequenos negócios no total de compras públicas no município': {
    descricao: 'Participação das MPE nas compras públicas aquém do potencial',
    indicadorLabel: 'Atenção',
    contexto: 'Benchmark nacional é de 25% do valor total de compras públicas para MPE',
  },
  'Linhas de Crédito Disponíveis': {
    descricao: 'Poucas linhas de crédito operacionais no município para MPE',
    indicadorLabel: 'Atenção',
    contexto: 'Ampliar convênios com agentes financeiros e cooperativas pode elevar acesso',
  },
}

// Fallback para indicadores sem contexto cadastrado
export const defaultRiscoContexto: RiscoContexto = {
  descricao: 'Indicador requer atenção e acompanhamento contínuo',
  indicadorLabel: 'Atenção',
  contexto: 'Valor abaixo da referência esperada para o município',
}
