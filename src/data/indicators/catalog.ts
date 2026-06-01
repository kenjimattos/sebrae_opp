import type { Catalog } from '@/types/indicators'

export const catalog: Catalog = {
  agendas: [
    {
      id: 'governanca',
      name: 'Governança: Parcerias público, privada, social para o desenvolvimento local',
      indicators: [
        { id: 'igm-cfa-2025', label: 'IGM – Índice CFA de Governança Municipal' },
        { id: 'idh-m-2021', label: 'IDH-M' },
        { id: 'isdel-governanca', label: 'Governança para o Desenvolvimento – ISDEL' },
        { id: 'igma', label: 'Índice de Gestão Municipal Áquila (IGMA)' },
      ],
    },
    {
      id: 'simplificacao',
      name: 'Serviços públicos mais simples e digitais para os pequenos negócios',
      indicators: [
        { id: 'tempo-viabilidade', label: 'Tempo médio de viabilidade da empresa' },
        { id: 'tempo-abertura', label: 'Tempo médio de abertura da empresa (h)' },
        { id: 'ranking-redesim', label: 'Ranking municipal Redesim/PB' },
        { id: 'tempo-licenciamento', label: 'Tempo de licenciamento' },
      ],
    },
    {
      id: 'inovacao',
      name: 'Ecossistemas de Inovação: Ambiente que apoia novas ideias e uso da tecnologia pelos pequenos negócios',
      indicators: [
        { id: 'trabalhadores-ct', label: 'Trabalhadores nas ocupações de C&T' },
        { id: 'trabalhadores-tic', label: 'Trabalhadores nos setores da economia criativa, inovação e TIC' },
        { id: 'mpe-eli-sebrae', label: 'Crescimento de MPE formalizadas nos ELI' },
        { id: 'compras-publicas-inovacao', label: 'Crescimento do valor das compras públicas de inovação nos pequenos negócios' },
      ],
    },
    {
      id: 'educacao',
      name: 'Educação empreendedora',
      indicators: [
        { id: 'educacao-isdel', label: 'Educação Empreendedora – ISDEL' },
        { id: 'ensino-medio', label: 'Trabalhadores formais com Ensino Médio Completo' },
        { id: 'ensino-superior', label: 'Trabalhadores formais Ensino Superior Completo' },
      ],
    },
    {
      id: 'credito',
      name: 'Acesso a crédito e viabilização financeira',
      indicators: [
        { id: 'credito-financiamento', label: 'Crédito concedido no município' },
        { id: 'bndes-operacoes', label: 'Operações não automáticas de crédito' },
      ],
    },
    {
      id: 'inclusao',
      name: 'Iniciativas para gerar trabalho e renda para os pequenos negócios',
      indicators: [
        { id: 'negocios-abertos', label: 'Pequenos negócios abertos' },
        { id: 'empresas-ativas', label: 'Empresas ativas' },
        { id: 'negocios-extintos', label: 'Pequenos negócios extintos' },
        { id: 'bolsa-familia', label: 'Crescimento de beneficiários (18 a 50 anos)' },
        { id: 'apoiados-sebrae', label: 'Pequenos negócios apoiados pelo Sebrae' },
        { id: 'mpe-compras-publicas', label: 'Participação em compras públicas dos pequenos negocios' },
        { id: 'linhas-credito', label: 'Linhas de Crédito Disponíveis' },
      ],
    },
  ],
  economicBase: [
    { id: 'idsc', label: 'IDSC - Índice de Desenvolvimento Sustentável das Cidades', icon: 'bar-chart' },
    { id: 'idh-m-total', label: 'IDH-M (2021)', icon: 'bar-chart' },
    { id: 'cobertura-atencao-basica', label: 'Cobertura Atenção Básica na Saúde', icon: 'users' },
    { id: 'ideb-anos-iniciais', label: 'IDEB 2023 - Anos Iniciais', icon: 'bar-chart' },
    { id: 'ideb-anos-finais', label: 'IDEB 2023 - Anos Finais', icon: 'bar-chart' },
    { id: 'gini', label: 'GINI (2010)', icon: 'bar-chart' },
    { id: 'remuneracao-media', label: 'Remuneração média (2024)', icon: 'trending-up' },
    { id: 'empresas-ativas-total', label: 'Empresas Ativas (2025)', icon: 'briefcase' },
    { id: 'pib-per-capita', label: 'PIB per capita (2021)', icon: 'trending-up' },
    { id: 'meis', label: 'MEI (2025)', icon: 'building' },
    { id: 'mes', label: 'ME (2025)', icon: 'building' },
    { id: 'epps', label: 'EPP (2025)', icon: 'building' },
  ],
}
