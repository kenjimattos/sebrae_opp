// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { ValoresMunicipio } from '@/types/indicadores'

export const conde: ValoresMunicipio = {
  municipio: 'Conde',
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
  baseEconomica: {
    'idsc': { valor: '42,3*', variacao: '*' },
    'idh-m-total': { valor: '0,618', variacao: 'PNUD 2021' },
    'cobertura-atencao-basica': { valor: '88%*', variacao: '*' },
    'ideb-anos-iniciais': { valor: '4,2*', variacao: '*' },
    'ideb-anos-finais': { valor: '3,8*', variacao: '*' },
    'gini': { valor: '0,490', variacao: 'IBGE 2010' },
    'remuneracao-media': { valor: 'R$ 2.180*', variacao: '*' },
    'empresas-ativas-total': { valor: '1.650*', variacao: '*' },
    'pib-per-capita': { valor: 'R$ 50.700', variacao: 'IBGE 2021' },
    'meis': { valor: '2.050*', variacao: '*' },
    'mes': { valor: '170*', variacao: '*' },
    'epps': { valor: '22*', variacao: '*' },
  },
}
