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
    { id: 'idsc', label: 'IDSC - Índice de Desenvolvimento Sustentável das Cidades', updatedAt: '2023' },
    { id: 'idh-m-total', label: 'IDH-M', updatedAt: '2021' },
    { id: 'cobertura-atencao-basica', label: 'Cobertura Atenção Básica na Saúde', updatedAt: '' },
    { id: 'ideb-anos-iniciais', label: 'IDEB - Anos Iniciais', updatedAt: '2023' },
    { id: 'ideb-anos-finais', label: 'IDEB - Anos Finais', updatedAt: '2023' },
    { id: 'gini', label: 'GINI', updatedAt: '2010' },
    { id: 'remuneracao-media', label: 'Remuneração média', updatedAt: '2024' },
    { id: 'empresas-ativas-total', label: 'Empresas Ativas', updatedAt: '2025' },
    { id: 'pib-per-capita', label: 'PIB per capita', updatedAt: '2021' },
    { id: 'meis', label: 'MEI', updatedAt: '2025' },
    { id: 'mes', label: 'ME', updatedAt: '2025' },
    { id: 'epps', label: 'EPP', updatedAt: '2025' },
  ],
}
