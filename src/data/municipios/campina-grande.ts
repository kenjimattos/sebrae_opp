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
    'pib-per-capita': { valor: 'R$ 25.066', variacao: '2021' },
    'participacao-mpe-pib': { valor: '34%*', variacao: '+1,8%*' },
    'taxa-desemprego': { valor: '11,2%*', variacao: '-0,5%*' },
    'indice-gem': { valor: '0,68*', variacao: '+0,04*' },
    'indice-ice': { valor: '4,21*', variacao: '+0,15*' },
    'dependencia-admin-publica': { valor: '42%*', variacao: '-1,2%*' },
    'empresas-ativas-total': { valor: '12.840*', variacao: '+4,1%*' },
    'populacao': { valor: '411.807', variacao: '2022' },
    'populacao-baixa-renda': { valor: '38,5%*', variacao: '-1,3%*' },
    'idh-m-total': { valor: '0,720', variacao: 'PNUD 2021' },
  },
}
