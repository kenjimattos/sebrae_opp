import TextInput from '@/components/ui/TextInput'
import { useFormulator } from '@/hooks/useFormulator'
import type { IndicatorsFormData } from '@/types/formulator'

type GroupKey = keyof IndicatorsFormData

interface GroupConfig {
  key: GroupKey
  title: string
  subtitle: string
  placeholder: string
  labelPrefix: string
}

const GROUPS: GroupConfig[] = [
  {
    key: 'results',
    title: 'Indicadores de Resultado',
    subtitle: '💡 Devem estar conectados aos objetivos definidos.',
    placeholder: 'Como medir se os objetivos foram alcançados',
    labelPrefix: 'Objetivo',
  },
  {
    key: 'impact',
    title: 'Indicadores de Impacto',
    subtitle: '💡 Devem estar conectados aos indicadores definidos.',
    placeholder: 'Mudanças de longo prazo esperadas',
    labelPrefix: 'Indicador',
  },
  {
    key: 'quantitative',
    title: 'Metas Quantitativas',
    subtitle: '💡 Devem estar conectados aos indicadores definidos.',
    placeholder: 'Principais marcos e entregas de cada fase',
    labelPrefix: 'Indicador',
  },
]

export default function StepIndicators() {
  const { state, setSlice } = useFormulator()
  const data = state.indicators
  const objectives = state.objectives.specific

  const setField = (group: GroupKey, idx: number, value: string) => {
    const arr = [...data[group]]
    while (arr.length <= idx) arr.push('')
    arr[idx] = value
    setSlice('indicators', { ...data, [group]: arr })
  }

  const count = Math.max(1, objectives.length)

  return (
    <div className="flex flex-col gap-md">
      {GROUPS.map((group) => (
        <div key={group.key} className="flex flex-col gap-xs">
          <p className="typo-body-bold">{group.title}</p>
          <p className="typo-body-sm">{group.subtitle}</p>
          <div className="flex flex-col gap-sm">
            {Array.from({ length: count }).map((_, idx) => {
              const value = data[group.key][idx] ?? ''
              const label = objectives[idx]?.trim() || `${group.labelPrefix} ${idx + 1}`
              return (
                <div key={idx} className="flex flex-col gap-2xs">
                  <span className="typo-body-sm">{label}</span>
                  <TextInput
                    value={value}
                    hint={group.placeholder}
                    onChange={(v) => setField(group.key, idx, v)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
