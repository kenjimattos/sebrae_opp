// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { ValoresMunicipio } from '@/types/indicadores'

export const cabaceiras: ValoresMunicipio = {
  municipio: 'Cabaceiras',
  agendas: {
    'igm-cfa-2025': '5,80',
    'idh-m-2021': '0,611',
    'isdel-governanca': '0,270',
    'igma': '47,24',
    'tempo-viabilidade': '13h',
    'tempo-abertura': '14h',
    'ranking-redesim': '835',
    'tempo-licenciamento': '25 dias*',
    'trabalhadores-ct': '28*',
    'trabalhadores-tic': '1,3%*',
    'mpe-eli-sebrae': '+6%*',
    'compras-publicas-inovacao': '+1%*',
    'educacao-isdel': '0',
    'ensino-medio': '61%*',
    'ensino-superior': '27,70%',
    'credito-financiamento': 'R$ 2M*',
    'bndes-operacoes': 'R$ 0,4M*',
    'negocios-abertos': '25*',
    'empresas-ativas': '310*',
    'negocios-extintos': '20*',
    'bolsa-familia': '+5,3%*',
    'apoiados-sebrae': '18*',
    'mpe-compras-publicas': '6%*',
    'linhas-credito': '3*',
  },
  baseEconomica: {
    'pib-per-capita': { valor: 'R$ 20.401', variacao: '2021' },
    'participacao-mpe-pib': { valor: '34%*', variacao: '+0,8%*' },
    'taxa-desemprego': { valor: '9%*', variacao: '-0,2%*' },
    'indice-gem': { valor: '0,55*', variacao: '+0,02*' },
    'indice-ice': { valor: '3,25*', variacao: '+0,06*' },
    'dependencia-admin-publica': { valor: '62%*', variacao: '-0,2%*' },
    'empresas-ativas-total': { valor: '310*', variacao: '+0,8%*' },
    'populacao': { valor: '5.537', variacao: '2025' },
    'populacao-baixa-renda': { valor: '46%*', variacao: '-0,5%*' },
    'idh-m-total': { valor: '0,611', variacao: 'PNUD 2021' },
  },
}
