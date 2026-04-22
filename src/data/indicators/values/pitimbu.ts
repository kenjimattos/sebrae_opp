// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { MunicipalityValues } from '@/types/indicators'

export const pitimbu: MunicipalityValues = {
  municipality: 'Pitimbu',
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
  economicBase: {
    'idsc': { value: '32,1*', variation: '+0,9%*' },
    'idh-m-total': { value: '0,570', variation: '+0,4%*' },
    'cobertura-atencao-basica': { value: '90%*', variation: '+1,1%*' },
    'ideb-anos-iniciais': { value: '3,7*', variation: '+3,3%*' },
    'ideb-anos-finais': { value: '3,4*', variation: '+2,6%*' },
    'gini': { value: '0,480', variation: '-0,3%*' },
    'remuneracao-media': { value: 'R$ 1.820*', variation: '+2,1%*' },
    'empresas-ativas-total': { value: '880*', variation: '+1,5%*' },
    'pib-per-capita': { value: 'R$ 22.092', variation: '+2,2%*' },
    'meis': { value: '1.120*', variation: '+3,1%*' },
    'mes': { value: '85*', variation: '+1,2%*' },
    'epps': { value: '10*', variation: '+0,5%*' },
  },
}
