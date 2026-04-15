// Test wrapper with MunicipioProvider context
import type { ReactNode } from 'react'
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
    <MunicipioContext.Provider value={mockMunicipioValue}>
      {children}
    </MunicipioContext.Provider>
  )
}
