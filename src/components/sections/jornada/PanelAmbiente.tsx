// Painel da aba "Ambiente de negócio".
// Dono do ModeToggle (2º nível) e do registry de modos: trocar de modo = trocar o
// componente renderizado. Plugar novo modo = criar componente + 1 entrada em MODES.

import { useState } from 'react'
import ModeToggle, { type ModeOption } from '@/components/ui/ModeToggle'
import ModeEixos from '@/components/agenda/ModeEixos'
import ModeEconomics from '@/components/economics/ModeEconomics'
import ModeRiscos from '@/components/risks/ModeRisks'

const MODES = [
  { value: 'agenda', label: 'Eixos prioritários', Component: ModeEixos },
  { value: 'economics', label: 'Panorâma Sócioeconômico', Component: ModeEconomics },
  { value: 'risks', label: 'Riscos estratégicos', Component: ModeRiscos },
]

const OPTIONS: ModeOption[] = MODES.map(({ value, label }) => ({ value, label }))

export default function PanelAmbiente() {
  const [mode, setMode] = useState('eixos')
  const Active = (MODES.find((m) => m.value === mode) ?? MODES[0]).Component

  return (
    <div className="contents">
      <ModeToggle
        value={mode}
        onChange={setMode}
        options={OPTIONS}
        ariaLabel="Modo do ambiente de negócio"
        className="self-center"
      />
      <Active />
    </div>
  )
}
