// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { ValoresMunicipio } from '@/types/indicadores'

export const joaoPessoa: ValoresMunicipio = {
  municipio: 'João Pessoa',
  agendas: {
    'igm-cfa-2025': '6,54',
    'idh-m-2021': '0,763',
    'isdel-governanca': '0,436',
    'igma': '58,24',
    'tempo-viabilidade': '9h',
    'tempo-abertura': '11h',
    'ranking-redesim': '851',
    'tempo-licenciamento': '12 dias*',
    'trabalhadores-ct': '4.850*',
    'trabalhadores-tic': '5,1%*',
    'mpe-eli-sebrae': '+12%*',
    'compras-publicas-inovacao': '+18%*',
    'educacao-isdel': '0,012',
    'ensino-medio': '78%*',
    'ensino-superior': '34%',
    'credito-financiamento': 'R$ 420M*',
    'bndes-operacoes': 'R$ 85M*',
    'negocios-abertos': '3.820*',
    'empresas-ativas': '45.230*',
    'negocios-extintos': '1.950*',
    'bolsa-familia': '+2,1%*',
    'apoiados-sebrae': '1.850*',
    'mpe-compras-publicas': '22%*',
    'linhas-credito': '18*',
  },
  baseEconomica: {
    'idsc': { valor: '58,4*', variacao: '+2,8%*' },
    'idh-m-total': { valor: '0,763', variacao: '+1,6%*' },
    'cobertura-atencao-basica': { valor: '82%*', variacao: '+3,1%*' },
    'ideb-anos-iniciais': { valor: '4,0', variacao: '+5,3%*' },
    'ideb-anos-finais': { valor: '3,7', variacao: '+4,2%*' },
    'gini': { valor: '0,630', variacao: '-1,2%*' },
    'remuneracao-media': { valor: 'R$ 3.200', variacao: '+6,4%*' },
    'empresas-ativas-total': { valor: '45.230*', variacao: '+5,4%*' },
    'pib-per-capita': { valor: 'R$ 26.900', variacao: '+3,8%*' },
    'meis': { valor: '62.400*', variacao: '+8,2%*' },
    'mes': { valor: '9.850*', variacao: '+4,1%*' },
    'epps': { valor: '1.420*', variacao: '+2,6%*' },
  },
}
