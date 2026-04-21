// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { ValoresMunicipio } from '@/types/indicadores'

export const queimadas: ValoresMunicipio = {
  municipio: 'Queimadas',
  agendas: {
    'igm-cfa-2025': '7,18',
    'idh-m-2021': '0,608',
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
    'educacao-isdel': '0',
    'ensino-medio': '64%*',
    'ensino-superior': '18,20%',
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
  baseEconomica: {
    'idsc': { valor: '38,6*', variacao: '+1,4%*' },
    'idh-m-total': { valor: '0,608', variacao: '+0,8%*' },
    'cobertura-atencao-basica': { valor: '92%*', variacao: '+1,6%*' },
    'ideb-anos-iniciais': { valor: '7,9', variacao: '+9,8%*' },
    'ideb-anos-finais': { valor: '5,8', variacao: '+6,2%*' },
    'gini': { valor: '0,520', variacao: '-0,5%*' },
    'remuneracao-media': { valor: 'R$ 1.950*', variacao: '+2,8%*' },
    'empresas-ativas-total': { valor: '2.818*', variacao: '+2,1%*' },
    'pib-per-capita': { valor: 'R$ 13.647*', variacao: '+1,8%*' },
    'meis': { valor: '3.420*', variacao: '+4,4%*' },
    'mes': { valor: '280*', variacao: '+1,9%*' },
    'epps': { valor: '32*', variacao: '+0,9%*' },
  },
}
