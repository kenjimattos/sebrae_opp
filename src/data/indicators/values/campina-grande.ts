// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { MunicipalityValues } from '@/types/indicators'

export const campinaGrande: MunicipalityValues = {
  municipality: 'Campina Grande',
  agendas: {
    'igm-cfa': '6,80',
    'idh-m': '0,720',
    'isdel-governanca': '0,438',
    'igma': '57,52',
    'tempo-viabilidade': '12h',
    'tempo-abertura': '15h',
    'ranking-redesim': '979',
    'tempo-licenciamento': '15 dias*',
    'trabalhadores-ct': '1.420*',
    'trabalhadores-tic': '3,2%*',
    'mpe-eli-sebrae': '+5%*',
    'compras-publicas-inovacao': '+4%*',
    'isdel-educacao-emp': '0',
    'trabalhadores-medio-completo': '72%*',
    'trabalhadores-superior-completo': '22,90%',
    'credito-financiamento': 'R$ 185M*',
    'bndes-operacoes': 'R$ 32M*',
    'negocios-abertos': '1.240*',
    'empresas-ativas': '12.840*',
    'negocios-extintos': '890*',
    'bolsa-familia': '+3,8%*',
    'apoiados-sebrae': '620*',
    'mpe-compras-publicas': '12%*',
    'linhas-credito': '10*',
  },
  economicBase: {
    'idsc': { value: '54,1*', variation: '+2,2%*', tone: 'warning' },
    'idh-m': { value: '0,720', variation: '+1,1%*', tone: 'success' },
    'cobertura-atencao-basica': { value: '78%*', variation: '+2,4%*', tone: 'warning' },
    'ideb-anos-iniciais': { value: '4,1', variation: '+4,8%*', tone: 'warning' },
    'ideb-anos-finais': { value: '3,9', variation: '+3,9%*', tone: 'warning' },
    'gini': { value: '0,590', variation: '-0,9%*', tone: 'alert' },
    'remuneracao-media': { value: 'R$ 2.400', variation: '+4,2%*', tone: 'success' },
    'empresas-ativas-total': { value: '12.840*', variation: '+4,1%*', tone: 'success' },
    'pib-per-capita': { value: 'R$ 25.066', variation: '+3,2%*', tone: 'warning' },
    'meis': { value: '28.600*', variation: '+6,5%*', tone: 'success' },
    'mes': { value: '3.720*', variation: '+3,3%*', tone: 'warning' },
    'epps': { value: '520*', variation: '+1,8%*', tone: 'alert' },
  },
}
