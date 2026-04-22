// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { ValoresMunicipio } from '@/types/indicadores'

export const monteiro: ValoresMunicipio = {
  municipio: 'Monteiro',
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
  baseEconomica: {
    'idsc': { valor: '40,2*', variacao: '+1,6%*' },
    'idh-m-total': { valor: '0,628', variacao: '+1,0%*' },
    'cobertura-atencao-basica': { valor: '96%*', variacao: '+1,8%*' },
    'ideb-anos-iniciais': { valor: '4,3*', variacao: '+4,9%*' },
    'ideb-anos-finais': { valor: '3,9*', variacao: '+3,7%*' },
    'gini': { valor: '0,560', variacao: '-0,6%*' },
    'remuneracao-media': { valor: 'R$ 2.050*', variacao: '+2,9%*' },
    'empresas-ativas-total': { valor: '1.950*', variacao: '+2,4%*' },
    'pib-per-capita': { valor: 'R$ 18.889', variacao: '+2,6%*' },
    'meis': { valor: '2.380*', variacao: '+4,1%*' },
    'mes': { valor: '220*', variacao: '+1,7%*' },
    'epps': { valor: '26*', variacao: '+0,8%*' },
  },
}
