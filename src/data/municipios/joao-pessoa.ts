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
    'pib-per-capita': { valor: 'R$ 26.900', variacao: '2021' },
    'participacao-mpe-pib': { valor: '31%*', variacao: '+1,5%*' },
    'taxa-desemprego': { valor: '8,7%*', variacao: '-1,1%*' },
    'indice-gem': { valor: '0,72*', variacao: '+0,05*' },
    'indice-ice': { valor: '4,58*', variacao: '+0,22*' },
    'dependencia-admin-publica': { valor: '38%*', variacao: '-0,8%*' },
    'empresas-ativas-total': { valor: '45.230*', variacao: '+5,4%*' },
    'populacao': { valor: '817.511', variacao: '2022' },
    'populacao-baixa-renda': { valor: '32,1%*', variacao: '-1,8%*' },
    'idh-m-total': { valor: '0,763', variacao: 'PNUD 2021' },
  },
}
