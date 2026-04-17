// Smoke tests: all section components render without crashing

import { render } from '@testing-library/react'
import { TestWrapper } from './mocks/wrapper'
import { mockAgendas, mockBaseEconomica } from './mocks/municipio'

// Mock react-leaflet (jsdom has no canvas)
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  GeoJSON: () => null,
  useMap: () => ({ getContainer: () => document.createElement('div') }),
}))

// Mock leaflet
vi.mock('leaflet', () => ({
  default: {
    divIcon: () => ({}),
    marker: () => ({ addTo: () => ({}), remove: () => {} }),
  },
  divIcon: () => ({}),
  marker: () => ({ addTo: () => ({}), remove: () => {} }),
}))

import SectionHero from '@/components/sections/SectionHero'
import SectionAgendas from '@/components/sections/SectionAgendas'
import SectionPanorama from '@/components/sections/SectionPanorama'
import SectionBaseEconomica from '@/components/sections/SectionBaseEconomica'
import SectionRiscos from '@/components/sections/SectionRiscos'
import SectionRecursos from '@/components/sections/SectionRecursos'
import SectionCapacitacao from '@/components/sections/SectionCapacitacao'
import SectionCasosSucesso from '@/components/sections/SectionCasosSucesso'
import SectionFormulador from '@/components/sections/SectionFormulador'
import SectionAIAssistant from '@/components/sections/SectionAIAssistant'

describe('Section components — smoke tests', () => {
  it('renders SectionHero', () => {
    const { container } = render(<SectionHero />)
    expect(container).toBeTruthy()
  })

  it('renders SectionAgendas', () => {
    const { container } = render(<SectionAgendas agendas={mockAgendas} />)
    expect(container).toBeTruthy()
  })

  it('renders SectionPanorama', () => {
    const { container } = render(
      <TestWrapper>
        <SectionPanorama />
      </TestWrapper>,
    )
    expect(container).toBeTruthy()
  })

  it('renders SectionBaseEconomica', () => {
    const { container } = render(<SectionBaseEconomica dados={mockBaseEconomica} />)
    expect(container).toBeTruthy()
  })

  it('renders SectionRiscos', () => {
    const { container } = render(<SectionRiscos agendas={mockAgendas} />)
    expect(container).toBeTruthy()
  })

  it('renders SectionRecursos', () => {
    const { container } = render(<SectionRecursos />)
    expect(container).toBeTruthy()
  })

  it('renders SectionCapacitacao', () => {
    const { container } = render(<SectionCapacitacao />)
    expect(container).toBeTruthy()
  })

  it('renders SectionCasosSucesso', () => {
    const { container } = render(<SectionCasosSucesso />)
    expect(container).toBeTruthy()
  })

  it('renders SectionFormulador', () => {
    const { container } = render(<SectionFormulador />)
    expect(container).toBeTruthy()
  })

  it('renders SectionAIAssistant', () => {
    const { container } = render(<SectionAIAssistant />)
    expect(container).toBeTruthy()
  })
})
