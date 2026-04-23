import type { IndicatorsData, Agenda, EconomicBaseItem } from '@/types/indicators'

export const mockAgendas: Agenda[] = [
  {
    id: 'governanca',
    name: 'Governança e Capacidade Fiscal',
    indicators: [
      { label: 'CFA', value: '0,521', status: 'warning' },
      { label: 'Receita própria', value: '42%', status: 'success' },
      { label: 'Investimento per capita', value: 'R$ 180', status: 'alert' },
    ],
  },
  {
    id: 'desenvolvimento-humano',
    name: 'Desenvolvimento Humano',
    indicators: [
      { label: 'IDHM', value: '0,720', status: 'success' },
      { label: 'Taxa de urbanização', value: '85%', status: 'success' },
    ],
  },
]

export const mockEconomicBase: EconomicBaseItem[] = [
  { id: 'pib-per-capita', label: 'PIB per capita', value: 'R$ 22.500', variation: '+3,2%', icon: 'trending-up' },
  { id: 'empresas-ativas-total', label: 'Empresas ativas', value: '12.450', variation: '+5,1%', icon: 'building' },
]

export const mockIndicatorsData: IndicatorsData = {
  municipality: 'Campina Grande',
  agendas: mockAgendas,
  economicBase: mockEconomicBase,
}
