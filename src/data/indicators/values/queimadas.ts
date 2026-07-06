// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { MunicipalityValues } from '@/types/indicators'

export const queimadas: MunicipalityValues = {
  municipality: 'Queimadas',
  agendas: {
    'igm-cfa': '7,18',
    'idh-m': '0,608',
    'isdel-governanca': '0,358',
    'igma': '48,30',
    'tempo-viabilidade': '20h',
    'tempo-abertura': '24h',
    'ranking-redesim': '562',
    'tempo-licenciamento': '20 dias*',
    'trabalhadores-ct': '290*',
    'trabalhadores-tic': '1,8%*',
    'mpe-eli-sebrae': '+3%*',
    'compras-publicas-inovacao': '+2%*',
    'isdel-educacao-emp': '0',
    'trabalhadores-medio-completo': '64%*',
    'trabalhadores-superior-completo': '18,20%',
    'credito-financiamento': 'R$ 18M*',
    'bndes-operacoes': 'R$ 3M*',
    'negocios-abertos': '230*',
    'empresas-ativas': '2.818',
    'negocios-extintos': '180*',
    'bolsa-familia': '+5,2%*',
    'apoiados-sebrae': '110*',
    'mpe-compras-publicas': '8%*',
    'linhas-credito': '6*',
  },
  economicBase: {
    'idsc': { value: '38,6*', variation: '+1,4%*', tone: 'alert' },
    'idh-m': { value: '0,608', variation: '+0,8%*', tone: 'warning' },
    'cobertura-atencao-basica': { value: '92%*', variation: '+1,6%*', tone: 'success' },
    'ideb-anos-iniciais': { value: '7,9', variation: '+9,8%*', tone: 'success' },
    'ideb-anos-finais': { value: '5,8', variation: '+6,2%*', tone: 'success' },
    'gini': { value: '0,520', variation: '-0,5%*', tone: 'warning' },
    'remuneracao-media': { value: 'R$ 1.950*', variation: '+2,8%*', tone: 'warning' },
    'empresas-ativas-total': { value: '2.818*', variation: '+2,1%*', tone: 'warning' },
    'pib-per-capita': { value: 'R$ 13.647*', variation: '+1,8%*', tone: 'alert' },
    'meis': { value: '3.420*', variation: '+4,4%*', tone: 'success' },
    'mes': { value: '280*', variation: '+1,9%*', tone: 'alert' },
    'epps': { value: '32*', variation: '+0,9%*', tone: 'alert' },
  },
}
