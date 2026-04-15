import type { IndicadoresData, Agenda, BaseEconomicaItem } from '@/types/indicadores'

export const mockAgendas: Agenda[] = [
  {
    nome: 'Governança e Capacidade Fiscal',
    indicadores: [
      { label: 'CFA', valor: '0,521', status: 'warning' },
      { label: 'Receita própria', valor: '42%', status: 'success' },
      { label: 'Investimento per capita', valor: 'R$ 180', status: 'alert' },
    ],
  },
  {
    nome: 'Desenvolvimento Humano',
    indicadores: [
      { label: 'IDHM', valor: '0,720', status: 'success' },
      { label: 'Taxa de urbanização', valor: '85%', status: 'success' },
    ],
  },
]

export const mockBaseEconomica: BaseEconomicaItem[] = [
  { label: 'PIB per capita', valor: 'R$ 22.500', variacao: '+3,2%', icone: 'trending-up' },
  { label: 'Empresas ativas', valor: '12.450', variacao: '+5,1%', icone: 'building' },
]

export const mockIndicadoresData: IndicadoresData = {
  municipio: 'Campina Grande',
  agendas: mockAgendas,
  baseEconomica: mockBaseEconomica,
  riscos: [],
}
