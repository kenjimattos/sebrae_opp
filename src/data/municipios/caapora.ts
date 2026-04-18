// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { ValoresMunicipio } from '@/types/indicadores'

export const caapora: ValoresMunicipio = {
  municipio: 'Caaporã',
  agendas: {
    'igm-cfa-2025': '4,92',
    'idh-m-2021': '0,602',
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
    'educacao-isdel': '0',
    'ensino-medio': '59%*',
    'ensino-superior': '14,60%',
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
  baseEconomica: {
    'pib-per-capita': { valor: 'R$ 21.157', variacao: '2021' },
    'participacao-mpe-pib': { valor: '32%*', variacao: '+0,6%*' },
    'taxa-desemprego': { valor: '13%*', variacao: '+0,2%*' },
    'indice-gem': { valor: '0,54*', variacao: '+0,01*' },
    'indice-ice': { valor: '3,20*', variacao: '+0,05*' },
    'dependencia-admin-publica': { valor: '55%*', variacao: '-0,4%*' },
    'empresas-ativas-total': { valor: '1.120*', variacao: '+1,6%*' },
    'populacao': { valor: '21.942', variacao: '2025' },
    'populacao-baixa-renda': { valor: '54%*', variacao: '-0,5%*' },
    'idh-m-total': { valor: '0,602', variacao: 'PNUD 2021' },
  },
}
