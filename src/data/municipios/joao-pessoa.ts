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
    'idsc': { valor: '58,4*', variacao: '*' },
    'idh-m-total': { valor: '0,763', variacao: 'PNUD 2021' },
    'cobertura-atencao-basica': { valor: '82%*', variacao: '*' },
    'ideb-anos-iniciais': { valor: '4,0', variacao: 'INEP 2023' },
    'ideb-anos-finais': { valor: '3,7', variacao: 'INEP 2023' },
    'gini': { valor: '0,630', variacao: 'IBGE 2010' },
    'remuneracao-media': { valor: 'R$ 3.200', variacao: 'CAGED 2024' },
    'empresas-ativas-total': { valor: '45.230*', variacao: '*' },
    'pib-per-capita': { valor: 'R$ 26.900', variacao: 'IBGE 2021' },
    'meis': { valor: '62.400*', variacao: '*' },
    'mes': { valor: '9.850*', variacao: '*' },
    'epps': { valor: '1.420*', variacao: '*' },
  },
}
