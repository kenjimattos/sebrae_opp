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
    'pib-per-capita': { valor: 'R$ 50.700', variacao: '2021' },
    'participacao-mpe-pib': { valor: '28%*', variacao: '+0,9%*' },
    'taxa-desemprego': { valor: '10%*', variacao: '-0,3%*' },
    'indice-gem': { valor: '0,62*', variacao: '+0,03*' },
    'indice-ice': { valor: '3,80*', variacao: '+0,10*' },
    'dependencia-admin-publica': { valor: '45%*', variacao: '-0,5%*' },
    'empresas-ativas-total': { valor: '1.650*', variacao: '+2,1%*' },
    'populacao': { valor: '30.007', variacao: '2025' },
    'populacao-baixa-renda': { valor: '42%*', variacao: '-0,7%*' },
    'idh-m-total': { valor: '0,618', variacao: 'PNUD 2021' },
  },
}
