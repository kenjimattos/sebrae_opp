// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { MunicipalityValues } from '@/types/indicators'

export const conde: MunicipalityValues = {
  municipality: 'Conde',
  agendas: {
    'igm-cfa-2025': '4,34',
    'idh-m-2021': '0,618',
    'isdel-governanca': '0,351',
    'igma': '45,62',
    'tempo-viabilidade': '27h',
    'tempo-abertura': '31h',
    'ranking-redesim': '511',
    'tempo-licenciamento': '22 dias*',
    'trabalhadores-ct': '180*',
    'trabalhadores-tic': '1,5%*',
    'mpe-eli-sebrae': '+2%*',
    'compras-publicas-inovacao': '+1%*',
    'educacao-isdel': '0',
    'ensino-medio': '62%*',
    'ensino-superior': '21,50%',
    'credito-financiamento': 'R$ 12M*',
    'bndes-operacoes': 'R$ 2M*',
    'negocios-abertos': '150*',
    'empresas-ativas': '1.650*',
    'negocios-extintos': '110*',
    'bolsa-familia': '+5,8%*',
    'apoiados-sebrae': '80*',
    'mpe-compras-publicas': '7%*',
    'linhas-credito': '5*',
  },
  economicBase: {
    'idsc': { value: '42,3*', variation: '+1,9%*' },
    'idh-m-total': { value: '0,618', variation: '+1,3%*' },
    'cobertura-atencao-basica': { value: '88%*', variation: '+2,1%*' },
    'ideb-anos-iniciais': { value: '4,2*', variation: '+4,6%*' },
    'ideb-anos-finais': { value: '3,8*', variation: '+3,5%*' },
    'gini': { value: '0,490', variation: '-0,7%*' },
    'remuneracao-media': { value: 'R$ 2.180*', variation: '+3,4%*' },
    'empresas-ativas-total': { value: '1.650*', variation: '+2,6%*' },
    'pib-per-capita': { value: 'R$ 50.700', variation: '+7,1%*' },
    'meis': { value: '2.050*', variation: '+5,2%*' },
    'mes': { value: '170*', variation: '+2,4%*' },
    'epps': { value: '22*', variation: '+1,1%*' },
  },
}
