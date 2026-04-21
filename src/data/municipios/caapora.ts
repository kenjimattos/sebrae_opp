// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { ValoresMunicipio } from '@/types/indicadores'

export const caapora: ValoresMunicipio = {
  municipio: 'Caaporã',
  agendas: {
    'igm-cfa-2025': '4,92',
    'idh-m-2021': '0,602',
    'isdel-governanca': '0,241',
    'igma': '44,58',
    'tempo-viabilidade': '35h',
    'tempo-abertura': '40h',
    'ranking-redesim': '617',
    'tempo-licenciamento': '28 dias*',
    'trabalhadores-ct': '110*',
    'trabalhadores-tic': '1,0%*',
    'mpe-eli-sebrae': '0%*',
    'compras-publicas-inovacao': '-1%*',
    'educacao-isdel': '0',
    'ensino-medio': '59%*',
    'ensino-superior': '14,60%',
    'credito-financiamento': 'R$ 7M*',
    'bndes-operacoes': 'R$ 1M*',
    'negocios-abertos': '90*',
    'empresas-ativas': '1.120*',
    'negocios-extintos': '85*',
    'bolsa-familia': '+6,4%*',
    'apoiados-sebrae': '50*',
    'mpe-compras-publicas': '5%*',
    'linhas-credito': '4*',
  },
  baseEconomica: {
    'idsc': { valor: '35,8*', variacao: '+1,1%*' },
    'idh-m-total': { valor: '0,602', variacao: '+0,6%*' },
    'cobertura-atencao-basica': { valor: '95%*', variacao: '+1,3%*' },
    'ideb-anos-iniciais': { valor: '3,9*', variacao: '+3,8%*' },
    'ideb-anos-finais': { valor: '3,6*', variacao: '+2,9%*' },
    'gini': { valor: '0,500', variacao: '-0,4%*' },
    'remuneracao-media': { valor: 'R$ 1.880*', variacao: '+2,4%*' },
    'empresas-ativas-total': { valor: '1.120*', variacao: '+1,9%*' },
    'pib-per-capita': { valor: 'R$ 21.157', variacao: '+2,5%*' },
    'meis': { valor: '1.440*', variacao: '+3,6%*' },
    'mes': { valor: '110*', variacao: '+1,4%*' },
    'epps': { valor: '14*', variacao: '+0,6%*' },
  },
}
