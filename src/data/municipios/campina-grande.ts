// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { ValoresMunicipio } from '@/types/indicadores'

export const campinaGrande: ValoresMunicipio = {
  municipio: 'Campina Grande',
  agendas: {
    'igm-cfa-2025': '6,80',
    'idh-m-2021': '0,720',
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
    'educacao-isdel': '0',
    'ensino-medio': '72%*',
    'ensino-superior': '22,90%',
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
  baseEconomica: {
    'idsc': { valor: '54,1*', variacao: '+2,2%*' },
    'idh-m-total': { valor: '0,720', variacao: '+1,1%*' },
    'cobertura-atencao-basica': { valor: '78%*', variacao: '+2,4%*' },
    'ideb-anos-iniciais': { valor: '4,1', variacao: '+4,8%*' },
    'ideb-anos-finais': { valor: '3,9', variacao: '+3,9%*' },
    'gini': { valor: '0,590', variacao: '-0,9%*' },
    'remuneracao-media': { valor: 'R$ 2.400', variacao: '+4,2%*' },
    'empresas-ativas-total': { valor: '12.840*', variacao: '+4,1%*' },
    'pib-per-capita': { valor: 'R$ 25.066', variacao: '+3,2%*' },
    'meis': { valor: '28.600*', variacao: '+6,5%*' },
    'mes': { valor: '3.720*', variacao: '+3,3%*' },
    'epps': { valor: '520*', variacao: '+1,8%*' },
  },
}
