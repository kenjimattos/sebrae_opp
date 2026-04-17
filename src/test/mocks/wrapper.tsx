// Test wrapper with MunicipioProvider context + MemoryRouter (for useLocation etc.)
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { MunicipioContext } from '@/hooks/useMunicipio'
import { mockIndicadoresData } from './municipio'

const mockMunicipioValue = {
  municipio: {
    id: '2504009',
    nome: 'Campina Grande',
    dados: mockIndicadoresData,
  },
  setMunicipio: () => {},
}

export function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <MunicipioContext.Provider value={mockMunicipioValue}>
        {children}
      </MunicipioContext.Provider>
    </MemoryRouter>
  )
}
