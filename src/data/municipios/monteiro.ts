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
    'pib-per-capita': { valor: 'R$ 18.889', variacao: '2021' },
    'participacao-mpe-pib': { valor: '36%*', variacao: '+1,0%*' },
    'taxa-desemprego': { valor: '11%*', variacao: '-0,3%*' },
    'indice-gem': { valor: '0,60*', variacao: '+0,02*' },
    'indice-ice': { valor: '3,50*', variacao: '+0,07*' },
    'dependencia-admin-publica': { valor: '48%*', variacao: '-0,5%*' },
    'empresas-ativas-total': { valor: '1.950*', variacao: '+2,4%*' },
    'populacao': { valor: '33.886', variacao: '2025' },
    'populacao-baixa-renda': { valor: '45%*', variacao: '-0,6%*' },
    'idh-m-total': { valor: '0,628', variacao: 'PNUD 2021' },
  },
}
