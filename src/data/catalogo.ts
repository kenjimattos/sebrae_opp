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
        { id: 'igm-cfa-2025', label: 'IGM – Índice CFA de Governança Municipal (Finanças, Gestão e Desempenho) 2025' },
        { id: 'idh-m-2021', label: 'IDH-M 2021' },
        { id: 'isdel-governanca', label: 'Governança para o Desenvolvimento – ISDEL 2023' },
        { id: 'igma', label: 'Índice de Gestão Municipal Áquila (IGMA)' },
      ],
    },
    {
      id: 'simplificacao',
      nome: 'Simplificação e digitalização de serviços públicos para os Pequenos Negócios',
      indicadores: [
        { id: 'tempo-viabilidade', label: 'Tempo médio de viabilidade da empresa (h) em relação à média estadual' },
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
        { id: 'mpe-eli-sebrae', label: 'Taxa de crescimento de MPE formalizadas nos ELI com apoio Sebrae' },
        { id: 'compras-publicas-inovacao', label: 'Taxa de crescimento do valor das compras públicas de inovação nos pequenos negócios' },
      ],
    },
    {
      id: 'educacao',
      nome: 'Educação empreendedora',
      indicadores: [
        { id: 'educacao-isdel', label: 'Subdimensão Educação Empreendedora, da dimensão Capital Empreendedor – ISDEL' },
        { id: 'ensino-medio', label: 'Trabalhadores formais com pelo menos o Ensino Médio Completo' },
        { id: 'ensino-superior', label: 'Trabalhadores formais com pelo menos o Ensino Superior Completo' },
      ],
    },
    {
      id: 'credito',
      nome: 'Acesso a crédito e viabilização financeira',
      indicadores: [
        { id: 'credito-financiamento', label: 'Valor (R$) das operações de crédito e de financiamento concedidos no município' },
        { id: 'bndes-operacoes', label: 'Valor (R$) total das Operações diretas e indiretas não automáticas (financiamento e crédito)' },
      ],
    },
    {
      id: 'inclusao',
      nome: 'Inclusão produtiva',
      indicadores: [
        { id: 'negocios-abertos', label: 'Total de pequenos negócios abertos' },
        { id: 'empresas-ativas', label: 'Total de empresas ativas' },
        { id: 'negocios-extintos', label: 'Total de pequenos negócios extintos no período' },
        { id: 'bolsa-familia', label: 'Taxa de crescimento anual de beneficiários do Bolsa Família entre 18 e 50 anos' },
        { id: 'apoiados-sebrae', label: 'Número de pequenos negócios apoiados pelo Sebrae' },
        { id: 'mpe-compras-publicas', label: '% dos pequenos negócios no total de compras públicas no município' },
        { id: 'linhas-credito', label: 'Linhas de Crédito Disponíveis' },
      ],
    },
  ],
  baseEconomica: [
    { id: 'pib-per-capita', label: 'PIB per capta', icone: 'trending-up' },
    { id: 'participacao-mpe-pib', label: 'Participação MPE no PIB', icone: 'building' },
    { id: 'taxa-desemprego', label: 'Taxa de desemprego', icone: 'users' },
    { id: 'indice-gem', label: 'Índice GEM', icone: 'bar-chart' },
    { id: 'indice-ice', label: 'Índice ICE', icone: 'bar-chart' },
    { id: 'dependencia-admin-publica', label: 'Dependência Adm. Pública', icone: 'building' },
    { id: 'empresas-ativas-total', label: 'Empresas ativas', icone: 'briefcase' },
    { id: 'populacao', label: 'População', icone: 'users' },
    { id: 'populacao-baixa-renda', label: 'Pop. até ½ sal. mínimo', icone: 'users' },
    { id: 'idh-m-total', label: 'IDH-M', icone: 'bar-chart' },
  ],
}
