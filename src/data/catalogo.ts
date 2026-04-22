// Fonte de verdade da estrutura de agendas e base econômica.
// Valores por município ficam em src/data/municipios/{slug}.ts e são
// mesclados com este catálogo pelo MunicipioProvider.

import type { Catalogo } from '@/types/indicadores'

export const catalogo: Catalogo = {
  agendas: [
    {
      id: 'governanca',
      nome: 'Governança multissetorial para o Desenvolvimento Local',
      indicadores: [
        { id: 'igm-cfa-2025', label: 'IGM – Índice CFA de Governança Municipal' },
        { id: 'idh-m-2021', label: 'IDH-M' },
        { id: 'isdel-governanca', label: 'Governança para o Desenvolvimento – ISDEL' },
        { id: 'igma', label: 'Índice de Gestão Municipal Áquila (IGMA)' },
      ],
    },
    {
      id: 'simplificacao',
      nome: 'Simplificação e digitalização de serviços públicos para os Pequenos Negócios',
      indicadores: [
        { id: 'tempo-viabilidade', label: 'Tempo médio de viabilidade da empresa' },
        { id: 'tempo-abertura', label: 'Tempo médio de abertura da empresa (h)' },
        { id: 'ranking-redesim', label: 'Ranking municipal Redesim/PB' },
        { id: 'tempo-licenciamento', label: 'Tempo de licenciamento' },
      ],
    },
    {
      id: 'inovacao',
      nome: 'Ecossistemas de Inovação: Inclusão e digitalização para Pequenos Negócios',
      indicadores: [
        { id: 'trabalhadores-ct', label: 'Trabalhadores nas ocupações de C&T' },
        { id: 'trabalhadores-tic', label: 'Trabalhadores nos setores da economia criativa, inovação e TIC' },
        { id: 'mpe-eli-sebrae', label: 'Crescimento de MPE formalizadas nos ELI' },
        { id: 'compras-publicas-inovacao', label: 'Crescimento do valor das compras públicas de inovação nos pequenos negócios' },
      ],
    },
    {
      id: 'educacao',
      nome: 'Educação empreendedora',
      indicadores: [
        { id: 'educacao-isdel', label: 'Educação Empreendedora – ISDEL' },
        { id: 'ensino-medio', label: 'Trabalhadores formais com Ensino Médio Completo' },
        { id: 'ensino-superior', label: 'Trabalhadores formais Ensino Superior Completo' },
      ],
    },
    {
      id: 'credito',
      nome: 'Acesso a crédito e viabilização financeira',
      indicadores: [
        { id: 'credito-financiamento', label: 'Crédito concedido no município' },
        { id: 'bndes-operacoes', label: 'Operações não automáticas de crédito' },
      ],
    },
    {
      id: 'inclusao',
      nome: 'Inclusão produtiva',
      indicadores: [
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
  baseEconomica: [
    { id: 'idsc', label: 'IDSC - Índice de Desenvolvimento Sustentavel das Cidades', icone: 'bar-chart' },
    { id: 'idh-m-total', label: 'IDH-M (2021)', icone: 'bar-chart' },
    { id: 'cobertura-atencao-basica', label: 'Cobertura Atenção Básica na Saúde', icone: 'users' },
    { id: 'ideb-anos-iniciais', label: 'IDEB 2023 - Anos Iniciais', icone: 'bar-chart' },
    { id: 'ideb-anos-finais', label: 'IDEB 2023 - Anos Finais', icone: 'bar-chart' },
    { id: 'gini', label: 'GINI (2010)', icone: 'bar-chart' },
    { id: 'remuneracao-media', label: 'Remuneração média (2024)', icone: 'trending-up' },
    { id: 'empresas-ativas-total', label: 'Empresas Ativas (2025)', icone: 'briefcase' },
    { id: 'pib-per-capita', label: 'PIB per capita (2021)', icone: 'trending-up' },
    { id: 'meis', label: 'MEI (2025)', icone: 'building' },
    { id: 'mes', label: 'ME (2025)', icone: 'building' },
    { id: 'epps', label: 'EPP (2025)', icone: 'building' },
  ],
}
