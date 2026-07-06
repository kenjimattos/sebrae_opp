// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { MunicipalityValues } from '@/types/indicators'

export const caapora: MunicipalityValues = {
  municipality: 'Caaporã',
  agendas: {
    'igm-cfa': '4,92',
    'idh-m': '0,602',
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
    'isdel-educacao-emp': '0',
    'trabalhadores-medio-completo': '59%*',
    'trabalhadores-superior-completo': '14,60%',
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
  economicBase: {
    'idsc': { value: '35,8*', variation: '+1,1%*', tone: 'alert' },
    'idh-m': { value: '0,602', variation: '+0,6%*', tone: 'warning' },
    'cobertura-atencao-basica': { value: '95%*', variation: '+1,3%*', tone: 'success' },
    'ideb-anos-iniciais': { value: '3,9*', variation: '+3,8%*', tone: 'alert' },
    'ideb-anos-finais': { value: '3,6*', variation: '+2,9%*', tone: 'warning' },
    'gini': { value: '0,500', variation: '-0,4%*', tone: 'warning' },
    'remuneracao-media': { value: 'R$ 1.880*', variation: '+2,4%*', tone: 'warning' },
    'empresas-ativas-total': { value: '1.120*', variation: '+1,9%*', tone: 'alert' },
    'pib-per-capita': { value: 'R$ 21.157', variation: '+2,5%*', tone: 'warning' },
    'meis': { value: '1.440*', variation: '+3,6%*', tone: 'warning' },
    'mes': { value: '110*', variation: '+1,4%*', tone: 'alert' },
    'epps': { value: '14*', variation: '+0,6%*', tone: 'alert' },
  },
}
