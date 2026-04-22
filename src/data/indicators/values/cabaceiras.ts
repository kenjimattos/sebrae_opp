// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { MunicipalityValues } from '@/types/indicators'

export const cabaceiras: MunicipalityValues = {
  municipality: 'Cabaceiras',
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
  economicBase: {
    'idsc': { value: '36,5*', variation: '+1,2%*' },
    'idh-m-total': { value: '0,611', variation: '+0,7%*' },
    'cobertura-atencao-basica': { value: '100%*', variation: '+1,0%*' },
    'ideb-anos-iniciais': { value: '4,0*', variation: '+4,4%*' },
    'ideb-anos-finais': { value: '3,6*', variation: '+3,1%*' },
    'gini': { value: '0,510', variation: '-0,5%*' },
    'remuneracao-media': { value: 'R$ 1.900*', variation: '+2,3%*' },
    'empresas-ativas-total': { value: '310*', variation: '+1,3%*' },
    'pib-per-capita': { value: 'R$ 20.401', variation: '+2,3%*' },
    'meis': { value: '380*', variation: '+2,8%*' },
    'mes': { value: '28*', variation: '+0,9%*' },
    'epps': { value: '4*', variation: '+0,4%*' },
  },
}
