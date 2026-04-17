// Test wrapper: MemoryRouter + MunicipioProvider + FormuladorProvider.
// FormuladorProvider é necessário para o Header (que expõe reset() ao clicar
// em logo/nav enquanto o usuário está em /formulador).
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { MunicipioContext } from '@/hooks/useMunicipio'
import FormuladorProvider from '@/hooks/FormuladorProvider'
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
        <FormuladorProvider>{children}</FormuladorProvider>
      </MunicipioContext.Provider>
    </MemoryRouter>
  )
}
