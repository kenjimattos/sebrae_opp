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
    'idsc': { valor: '36,5*', variacao: '+1,2%*' },
    'idh-m-total': { valor: '0,611', variacao: '+0,7%*' },
    'cobertura-atencao-basica': { valor: '100%*', variacao: '+1,0%*' },
    'ideb-anos-iniciais': { valor: '4,0*', variacao: '+4,4%*' },
    'ideb-anos-finais': { valor: '3,6*', variacao: '+3,1%*' },
    'gini': { valor: '0,510', variacao: '-0,5%*' },
    'remuneracao-media': { valor: 'R$ 1.900*', variacao: '+2,3%*' },
    'empresas-ativas-total': { valor: '310*', variacao: '+1,3%*' },
    'pib-per-capita': { valor: 'R$ 20.401', variacao: '+2,3%*' },
    'meis': { valor: '380*', variacao: '+2,8%*' },
    'mes': { valor: '28*', variacao: '+0,9%*' },
    'epps': { valor: '4*', variacao: '+0,4%*' },
  },
}
