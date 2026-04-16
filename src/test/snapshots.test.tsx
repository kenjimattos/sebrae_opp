// Snapshot tests: capture HTML structure of components most affected by CSS refactor
// When CSS classes change, snapshots break intentionally — review diff then update with `vitest run -u`

import { render } from '@testing-library/react'
import { TestWrapper } from './mocks/wrapper'

import AgendaBadge from '@/components/agenda/AgendaBadge'
import AgendaStats from '@/components/agenda/AgendaStats'
import EconomicsCard from '@/components/economics/EconomicsCard'
import RisksCard from '@/components/risks/RisksCard'
import SectionHeader from '@/components/ui/SectionHeader'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionCard from '@/components/ui/SectionCard'
import ResourcesCard from '@/components/resources/ResourcesCard'
import AgendaIndicator from '@/components/agenda/AgendaIndicator'

describe('Snapshot tests — CSS refactor safety', () => {
  it('AgendaBadge', () => {
    const { container } = render(<AgendaBadge status="warning" value="0,521" />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('AgendaStats', () => {
    const { container } = render(
      <AgendaStats total={10} counts={{ success: 5, warning: 3, alert: 2 }} />,
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('AgendaIndicator', () => {
    const { container } = render(
      <AgendaIndicator label="IDHM" valor="0,720" status="success" />,
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('EconomicsCard', () => {
    const { container } = render(
      <EconomicsCard label="PIB per capita" valor="R$ 22.500" variacao="+3,2%" icone="trending-up" />,
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('RisksCard', () => {
    const { container } = render(
      <RisksCard
        label="Investimento per capita"
        valor="R$ 180"
        tipo="alert"
        descricao="Valor abaixo da média"
        indicadorLabel="Investimento público"
        contexto="Contexto de risco"
      />,
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('ResourcesCard', () => {
    const { container } = render(
      <ResourcesCard title="Total empenhado" value="R$ 4,1 bilhões" />,
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('SectionHeader — title only', () => {
    const { container } = render(<SectionHeader title="Panorama" />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('SectionHeader — with description', () => {
    const { container } = render(
      <SectionHeader title="Panorama" description="Descrição da seção" />,
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('TitleSubtitle', () => {
    const { container } = render(
      <TitleSubtitle title="Emendas parlamentares" subtitle="Recursos destinados" />,
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('Header', () => {
    const { container } = render(<Header />, { wrapper: TestWrapper })
    expect(container.firstChild).toMatchSnapshot()
  })

  it('Footer', () => {
    const { container } = render(<Footer />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('SectionContainer', () => {
    const { container } = render(
      <SectionContainer>
        <div>Content</div>
      </SectionContainer>,
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('SectionCard', () => {
    const { container } = render(
      <SectionCard padding="md">
        <div>Content</div>
      </SectionCard>,
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
