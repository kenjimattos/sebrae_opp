// Painel da aba "Ambiente de negócio".
// Dono do ModeToggle (2º nível) e do registry de modos: trocar de modo = trocar o
// componente renderizado. Plugar novo modo = criar componente + 1 entrada em MODES.

import { useState } from 'react'
import ModeToggle, { type ModeOption } from '@/components/ui/ModeToggle'
import ModeEixos from './modes/ModeEixos'
import ModePanorama from './modes/ModePanorama'
import ModeRiscos from './modes/ModeRiscos'

const MODES = [
  { value: 'eixos', label: 'Eixos prioritários', Component: ModeEixos },
  { value: 'panorama', label: 'Panorâma Sócioeconômico', Component: ModePanorama },
  { value: 'riscos', label: 'Riscos estratégicos', Component: ModeRiscos },
]

const OPTIONS: ModeOption[] = MODES.map(({ value, label }) => ({ value, label }))

export default function PanelAmbiente() {
  const [mode, setMode] = useState('eixos')
  const Active = (MODES.find((m) => m.value === mode) ?? MODES[0]).Component

  return (
    <>
      <ModeToggle
        value={mode}
        onChange={setMode}
        options={OPTIONS}
        ariaLabel="Modo do ambiente de negócio"
      />
      <Active />
    </>
  )
}
