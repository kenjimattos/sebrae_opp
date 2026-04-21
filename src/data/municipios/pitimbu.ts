// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { ValoresMunicipio } from '@/types/indicadores'

export const pitimbu: ValoresMunicipio = {
  municipio: 'Pitimbu',
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
  baseEconomica: {
    'idsc': { valor: '32,1*', variacao: '*' },
    'idh-m-total': { valor: '0,570', variacao: 'PNUD 2021' },
    'cobertura-atencao-basica': { valor: '90%*', variacao: '*' },
    'ideb-anos-iniciais': { valor: '3,7*', variacao: '*' },
    'ideb-anos-finais': { valor: '3,4*', variacao: '*' },
    'gini': { valor: '0,480', variacao: 'IBGE 2010' },
    'remuneracao-media': { valor: 'R$ 1.820*', variacao: '*' },
    'empresas-ativas-total': { valor: '880*', variacao: '*' },
    'pib-per-capita': { valor: 'R$ 22.092', variacao: 'IBGE 2021' },
    'meis': { valor: '1.120*', variacao: '*' },
    'mes': { valor: '85*', variacao: '*' },
    'epps': { valor: '10*', variacao: '*' },
  },
}
