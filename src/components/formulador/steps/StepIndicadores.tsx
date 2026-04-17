import TextInput from '@/components/ui/TextInput'
import { useFormulador } from '@/hooks/useFormulador'
import type { IndicadoresData } from '@/types/formulador'

type GrupoKey = keyof IndicadoresData

interface GrupoConfig {
  key: GrupoKey
  title: string
  subtitle: string
  placeholder: string
  labelPrefix: string
}

const GRUPOS: GrupoConfig[] = [
  {
    key: 'resultado',
    title: 'Indicadores de Resultado',
    subtitle: '💡 Devem estar conectados aos objetivos definidos.',
    placeholder: 'Como medir se os objetivos foram alcançados',
    labelPrefix: 'Objetivo',
  },
  {
    key: 'impacto',
    title: 'Indicadores de Impacto',
    subtitle: '💡 Devem estar conectados aos indicadores definidos.',
    placeholder: 'Mudanças de longo prazo esperadas',
    labelPrefix: 'Indicador',
  },
  {
    key: 'quantitativas',
    title: 'Metas Quantitativas',
    subtitle: '💡 Devem estar conectados aos indicadores definidos.',
    placeholder: 'Principais marcos e entregas de cada fase',
    labelPrefix: 'Indicador',
  },
]

export default function StepIndicadores() {
  const { state, setSlice } = useFormulador()
  const data = state.indicadores

  const setCampo = (grupo: GrupoKey, idx: number, value: string) => {
    const arr = [...data[grupo]]
    arr[idx] = value
    setSlice('indicadores', { ...data, [grupo]: arr })
  }

  return (
    <div className="flex flex-col gap-md">
      {GRUPOS.map((grupo) => (
        <div key={grupo.key} className="flex flex-col gap-xs">
          <p className="typo-body-bold">{grupo.title}</p>
          <p className="typo-body-sm">{grupo.subtitle}</p>
          <div className="flex flex-col gap-sm">
            {data[grupo.key].map((valor, idx) => (
              <div key={idx} className="flex flex-col gap-2xs">
                <span className="typo-body-sm">{grupo.labelPrefix} {idx + 1}</span>
                <TextInput
                  value={valor}
                  hint={grupo.placeholder}
                  onChange={(v) => setCampo(grupo.key, idx, v)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
