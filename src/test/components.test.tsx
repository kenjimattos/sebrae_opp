// Smoke tests: individual components render without crashing

import { render } from '@testing-library/react'
import { TestWrapper } from './mocks/wrapper'

// Agenda
import AgendaCard from '@/components/agenda/AgendaCard'
import AgendaBadge from '@/components/agenda/AgendaBadge'
import AgendaStats from '@/components/agenda/AgendaStats'
import AgendaIndicator from '@/components/agenda/AgendaIndicator'

// Economics
import EconomicsCard from '@/components/economics/EconomicsCard'
import EconomicsAnalysis from '@/components/economics/EconomicsAnalysis'

// Risks
import RisksCard from '@/components/risks/RisksCard'

// Resources
import ResourcesCard from '@/components/resources/ResourcesCard'

// Courses
import CoursesCard from '@/components/courses/CoursesCard'
import CoursesCardRow from '@/components/courses/CoursesCardRow'

// Case Studies
import CaseStudiesCard from '@/components/case-studies/CaseStudiesCard'

// Shared
import SectionHeader from '@/components/ui/SectionHeader'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import User from '@/components/layout/User'
import CitySelector from '@/components/layout/CitySelector'

// UI primitives
import Button from '@/components/ui/buttons/Button'
import PillButton from '@/components/ui/buttons/PillButton'
import Dropdown from '@/components/ui/Dropdown'
import SectionCard from '@/components/ui/SectionCard'
import SectionContainer from '@/components/ui/SectionContainer'

// Formulador
import FormuladorCard from '@/components/formulador/FormuladorCard'

// Layout
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

describe('Agenda components', () => {
  it('renders AgendaCard', () => {
    const { container } = render(
      <AgendaCard
        title="Governança"
        indicadores={[
          { label: 'CFA', valor: '0,521', status: 'warning' },
          { label: 'Receita', valor: '42%', status: 'success' },
        ]}
      />,
    )
    expect(container).toBeTruthy()
  })

  it('renders AgendaBadge', () => {
    const { container } = render(<AgendaBadge status="success" value="0,720" />)
    expect(container).toBeTruthy()
  })

  it('renders AgendaStats', () => {
    const { container } = render(
      <AgendaStats total={10} counts={{ success: 5, warning: 3, alert: 2 }} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders AgendaIndicator', () => {
    const { container } = render(
      <AgendaIndicator label="IDHM" valor="0,720" status="success" />,
    )
    expect(container).toBeTruthy()
  })
})

describe('Economics components', () => {
  it('renders EconomicsCard', () => {
    const { container } = render(
      <EconomicsCard label="PIB per capita" valor="R$ 22.500" variacao="+3,2%" icone="trending-up" />,
    )
    expect(container).toBeTruthy()
  })

  it('renders EconomicsAnalysis', () => {
    const { container } = render(<EconomicsAnalysis />)
    expect(container).toBeTruthy()
  })
})

describe('Risks components', () => {
  it('renders RisksCard', () => {
    const { container } = render(
      <RisksCard
        label="Investimento per capita"
        valor="R$ 180"
        tipo="alert"
        descricao="Valor abaixo da média estadual"
        indicadorLabel="Investimento público"
        contexto="Contexto de risco"
      />,
    )
    expect(container).toBeTruthy()
  })
})

describe('Resources components', () => {
  it('renders ResourcesCard', () => {
    const { container } = render(
      <ResourcesCard title="Total empenhado" value="R$ 4,1 bilhões" />,
    )
    expect(container).toBeTruthy()
  })
})

describe('Courses components', () => {
  it('renders CoursesCard', () => {
    const { container } = render(
      <CoursesCard
        title="Formulação de Políticas"
        description="Do diagnóstico ao desenho"
        cursos={[{ titulo: 'Avaliação de Impacto', carga: '36 Horas' }]}
      />,
    )
    expect(container).toBeTruthy()
  })

  it('renders CoursesCardRow', () => {
    const { container } = render(
      <CoursesCardRow title="Avaliação de Impacto" subtitle="36 Horas" />,
    )
    expect(container).toBeTruthy()
  })
})

describe('Case Studies components', () => {
  it('renders CaseStudiesCard', () => {
    const { container } = render(
      <CaseStudiesCard
        caso={{
          id: '1',
          cidade: 'Campina Grande',
          titulo: 'Programa de Inovação',
          descricao: 'Descrição do caso',
          imagem: '/assets/case-1.jpg',
        }}
      />,
    )
    expect(container).toBeTruthy()
  })
})

describe('Shared components', () => {
  it('renders SectionHeader', () => {
    const { container } = render(<SectionHeader title="Panorama" />)
    expect(container).toBeTruthy()
  })

  it('renders SectionHeader with description', () => {
    const { container } = render(
      <SectionHeader title="Panorama" description="Descrição" />,
    )
    expect(container).toBeTruthy()
  })

  it('renders TitleSubtitle', () => {
    const { container } = render(
      <TitleSubtitle title="Título" subtitle="Conteúdo" />,
    )
    expect(container).toBeTruthy()
  })

  it('renders User', () => {
    const { container } = render(<User />)
    expect(container).toBeTruthy()
  })

  it('renders CitySelector', () => {
    const { container } = render(<CitySelector />, { wrapper: TestWrapper })
    expect(container).toBeTruthy()
  })
})

describe('UI primitives', () => {
  it('renders Button', () => {
    const { container } = render(<Button label="Click" />)
    expect(container).toBeTruthy()
  })

  it('renders PillButton', () => {
    const { container } = render(<PillButton label="Explorar" href="#" />)
    expect(container).toBeTruthy()
  })

  it('renders Dropdown', () => {
    const { container } = render(
      <Dropdown
        options={[{ label: 'IDHM', value: 'idhm' }]}
        value="idhm"
        onChange={() => {}}
      />,
    )
    expect(container).toBeTruthy()
  })

  it('renders SectionCard', () => {
    const { container } = render(<SectionCard>Content</SectionCard>)
    expect(container).toBeTruthy()
  })

  it('renders SectionContainer', () => {
    const { container } = render(<SectionContainer>Content</SectionContainer>)
    expect(container).toBeTruthy()
  })
})

describe('Formulador components', () => {
  it('renders FormuladorCard', () => {
    const { container } = render(
      <FormuladorCard
        titulo="Novo projeto"
        descricao="Crie um novo projeto"
        buttonLabel="Começar"
        buttonHref="#"
      />,
    )
    expect(container).toBeTruthy()
  })
})

describe('Layout components', () => {
  it('renders Header', () => {
    const { container } = render(<Header />, { wrapper: TestWrapper })
    expect(container).toBeTruthy()
  })

  it('renders Footer', () => {
    const { container } = render(<Footer />)
    expect(container).toBeTruthy()
  })
})
