// Valores marcados com "*" são fictícios (demo). Demais vêm dos CSVs ou
// fontes públicas (IBGE, PNUD, Sebrae).

import type { MunicipalityValues } from '@/types/indicators'

export const joaoPessoa: MunicipalityValues = {
  municipality: 'João Pessoa',
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
  economicBase: {
    'idsc': { value: '58,4*', variation: '+2,8%*' },
    'idh-m-total': { value: '0,763', variation: '+1,6%*' },
    'cobertura-atencao-basica': { value: '82%*', variation: '+3,1%*' },
    'ideb-anos-iniciais': { value: '4,0', variation: '+5,3%*' },
    'ideb-anos-finais': { value: '3,7', variation: '+4,2%*' },
    'gini': { value: '0,630', variation: '-1,2%*' },
    'remuneracao-media': { value: 'R$ 3.200', variation: '+6,4%*' },
    'empresas-ativas-total': { value: '45.230*', variation: '+5,4%*' },
    'pib-per-capita': { value: 'R$ 26.900', variation: '+3,8%*' },
    'meis': { value: '62.400*', variation: '+8,2%*' },
    'mes': { value: '9.850*', variation: '+4,1%*' },
    'epps': { value: '1.420*', variation: '+2,6%*' },
  },
}
