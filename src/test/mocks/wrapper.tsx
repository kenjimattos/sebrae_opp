// Test wrapper: MemoryRouter + MunicipalityProvider + FormulatorProvider.
// FormulatorProvider é necessário para o Header (que expõe reset() ao clicar
// em logo/nav enquanto o usuário está em /formulador).
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { MunicipalityContext } from '@/hooks/useMunicipality'
import FormulatorProvider from '@/hooks/FormulatorProvider'
import { mockIndicatorsData } from './municipality'

const mockMunicipalityValue = {
  municipality: {
    id: '2504009',
    name: 'Campina Grande',
    data: mockIndicatorsData,
  },
  setMunicipality: () => {},
}

export function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <MunicipalityContext.Provider value={mockMunicipalityValue}>
        <FormulatorProvider>{children}</FormulatorProvider>
      </MunicipalityContext.Provider>
    </MemoryRouter>
  )
}
