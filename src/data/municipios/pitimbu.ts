// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { ValoresMunicipio } from '@/types/indicadores'

export const pitimbu: ValoresMunicipio = {
  municipio: 'Pitimbu',
  agendas: {
    'igm-cfa-2025': '5,50',
    'idh-m-2021': '0,570',
    'isdel-governanca': '0,228',
    'igma': '37,35',
    'tempo-viabilidade': '36h',
    'tempo-abertura': '41h',
    'ranking-redesim': '631',
    'tempo-licenciamento': '30 dias*',
    'trabalhadores-ct': '85*',
    'trabalhadores-tic': '0,9%*',
    'mpe-eli-sebrae': '-1%*',
    'compras-publicas-inovacao': '-2%*',
    'educacao-isdel': '0',
    'ensino-medio': '58%*',
    'ensino-superior': '25,20%',
    'credito-financiamento': 'R$ 5M*',
    'bndes-operacoes': 'R$ 0,9M*',
    'negocios-abertos': '70*',
    'empresas-ativas': '880*',
    'negocios-extintos': '70*',
    'bolsa-familia': '+6,9%*',
    'apoiados-sebrae': '35*',
    'mpe-compras-publicas': '4%*',
    'linhas-credito': '3*',
  },
  baseEconomica: {
    'pib-per-capita': { valor: 'R$ 22.092', variacao: '2021' },
    'participacao-mpe-pib': { valor: '30%*', variacao: '+0,5%*' },
    'taxa-desemprego': { valor: '14%*', variacao: '+0,3%*' },
    'indice-gem': { valor: '0,52*', variacao: '+0,01*' },
    'indice-ice': { valor: '3,10*', variacao: '+0,04*' },
    'dependencia-admin-publica': { valor: '58%*', variacao: '-0,3%*' },
    'empresas-ativas-total': { valor: '880*', variacao: '+1,3%*' },
    'populacao': { valor: '17.166', variacao: '2025' },
    'populacao-baixa-renda': { valor: '58%*', variacao: '-0,4%*' },
    'idh-m-total': { valor: '0,570', variacao: 'PNUD 2021' },
  },
}
