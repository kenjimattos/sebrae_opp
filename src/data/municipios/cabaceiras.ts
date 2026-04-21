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
    'idsc': { valor: '36,5*', variacao: '*' },
    'idh-m-total': { valor: '0,611', variacao: 'PNUD 2021' },
    'cobertura-atencao-basica': { valor: '100%*', variacao: '*' },
    'ideb-anos-iniciais': { valor: '4,0*', variacao: '*' },
    'ideb-anos-finais': { valor: '3,6*', variacao: '*' },
    'gini': { valor: '0,510', variacao: 'IBGE 2010' },
    'remuneracao-media': { valor: 'R$ 1.900*', variacao: '*' },
    'empresas-ativas-total': { valor: '310*', variacao: '*' },
    'pib-per-capita': { valor: 'R$ 20.401', variacao: 'IBGE 2021' },
    'meis': { valor: '380*', variacao: '*' },
    'mes': { valor: '28*', variacao: '*' },
    'epps': { valor: '4*', variacao: '*' },
  },
}
