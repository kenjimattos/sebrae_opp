// Smoke tests: all section components render without crashing

import { render } from '@testing-library/react'
import { TestWrapper } from './mocks/wrapper'
import { mockAgendas } from './mocks/municipality'

import SectionHero from '@/components/sections/SectionHero'
import SectionRisks from '@/components/sections/SectionRisks'
import SectionResources from '@/components/sections/SectionResources'
import SectionTraining from '@/components/sections/SectionTraining'
import SectionCaseStudies from '@/components/sections/SectionCaseStudies'
import SectionFormulator from '@/components/sections/SectionFormulator'
import SectionAIAssistant from '@/components/sections/SectionAIAssistant'

describe('Section components — smoke tests', () => {
  it('renders SectionHero', () => {
    const { container } = render(<SectionHero />)
    expect(container).toBeTruthy()
  })

  it('renders SectionRisks', () => {
    const { container } = render(<SectionRisks agendas={mockAgendas} />)
    expect(container).toBeTruthy()
  })

  it('renders SectionResources', () => {
    const { container } = render(<SectionResources />, { wrapper: TestWrapper })
    expect(container).toBeTruthy()
  })

  it('renders SectionTraining', () => {
    const { container } = render(<SectionTraining />, { wrapper: TestWrapper })
    expect(container).toBeTruthy()
  })

  it('renders SectionCaseStudies', () => {
    const { container } = render(<SectionCaseStudies />, { wrapper: TestWrapper })
    expect(container).toBeTruthy()
  })

  it('renders SectionFormulator', () => {
    const { container } = render(<SectionFormulator />, { wrapper: TestWrapper })
    expect(container).toBeTruthy()
  })

  it('renders SectionAIAssistant', () => {
    const { container } = render(<SectionAIAssistant />)
    expect(container).toBeTruthy()
  })
})
