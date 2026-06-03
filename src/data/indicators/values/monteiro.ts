// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { MunicipalityValues } from '@/types/indicators'

export const monteiro: MunicipalityValues = {
  municipality: 'Monteiro',
  agendas: {
    'igm-cfa-2025': '6,77',
    'idh-m-2021': '0,628',
    'isdel-governanca': '0,301',
    'igma': '50,84',
    'tempo-viabilidade': '19h',
    'tempo-abertura': '21h',
    'ranking-redesim': '1075',
    'tempo-licenciamento': '18 dias*',
    'trabalhadores-ct': '220*',
    'trabalhadores-tic': '1,7%*',
    'mpe-eli-sebrae': '+4%*',
    'compras-publicas-inovacao': '+2%*',
    'educacao-isdel': '0,007',
    'ensino-medio': '67%*',
    'ensino-superior': '29,60%',
    'credito-financiamento': 'R$ 22M*',
    'bndes-operacoes': 'R$ 4M*',
    'negocios-abertos': '180*',
    'empresas-ativas': '1.950*',
    'negocios-extintos': '140*',
    'bolsa-familia': '+4,8%*',
    'apoiados-sebrae': '125*',
    'mpe-compras-publicas': '11%*',
    'linhas-credito': '7*',
  },
  economicBase: {
    'idsc': { value: '40,2*', variation: '+1,6%*', tone: 'warning' },
    'idh-m-total': { value: '0,628', variation: '+1,0%*', tone: 'warning' },
    'cobertura-atencao-basica': { value: '96%*', variation: '+1,8%*', tone: 'success' },
    'ideb-anos-iniciais': { value: '4,3*', variation: '+4,9%*', tone: 'warning' },
    'ideb-anos-finais': { value: '3,9*', variation: '+3,7%*', tone: 'warning' },
    'gini': { value: '0,560', variation: '-0,6%*', tone: 'alert' },
    'remuneracao-media': { value: 'R$ 2.050*', variation: '+2,9%*', tone: 'warning' },
    'empresas-ativas-total': { value: '1.950*', variation: '+2,4%*', tone: 'warning' },
    'pib-per-capita': { value: 'R$ 18.889', variation: '+2,6%*', tone: 'warning' },
    'meis': { value: '2.380*', variation: '+4,1%*', tone: 'success' },
    'mes': { value: '220*', variation: '+1,7%*', tone: 'alert' },
    'epps': { value: '26*', variation: '+0,8%*', tone: 'alert' },
  },
}
