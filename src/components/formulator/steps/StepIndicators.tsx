import { useRef, useState } from 'react'
import TextInput from '@/components/ui/TextInput'
import Button from '@/components/ui/buttons/Button'
import { Sparkles } from '@/components/icons'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useAiTask } from '@/hooks/useAiTask'
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
  const { municipality } = useMunicipality()
  const data = state.indicators
  const objectives = state.objectives.specific

  // Geração por grupo (IA): um item por objetivo específico, na mesma ordem.
  const ai = useAiTask()
  const [busyGroup, setBusyGroup] = useState<GroupKey | null>(null)
  const [errorGroup, setErrorGroup] = useState<GroupKey | null>(null)
  const [undoableGroups, setUndoableGroups] = useState<Partial<Record<GroupKey, boolean>>>({})
  const previous = useRef<Partial<Record<GroupKey, string[]>>>({})

  const filledObjectives = objectives.filter((o) => o.trim() !== '')

  const setField = (group: GroupKey, idx: number, value: string) => {
    const arr = [...data[group]]
    while (arr.length <= idx) arr.push('')
    arr[idx] = value
    setSlice('indicators', { ...data, [group]: arr })
  }

  async function generateGroup(group: GroupKey) {
    if (ai.status === 'loading' || filledObjectives.length === 0) return
    previous.current[group] = data[group]
    setUndoableGroups((u) => ({ ...u, [group]: false }))
    setErrorGroup(null)
    setBusyGroup(group)
    const result = await ai.run({
      task: 'generate-indicators',
      group,
      objectives: filledObjectives,
      municipality: { id: municipality.id, name: municipality.name },
      context: { objetivoGeral: state.objectives.general },
    })
    setBusyGroup(null)
    // Sem typewriter (padrão do "Gerar objetivos específicos"): arrays de
    // inputs não animam bem — a lista aparece preenchida.
    if (result?.items && result.items.length > 0) {
      setSlice('indicators', { ...data, [group]: result.items })
      setUndoableGroups((u) => ({ ...u, [group]: true }))
    } else {
      setErrorGroup(group)
    }
  }

  function undoGroup(group: GroupKey) {
    const prev = previous.current[group]
    if (prev) setSlice('indicators', { ...data, [group]: prev })
    setUndoableGroups((u) => ({ ...u, [group]: false }))
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
                    disabled={busyGroup === group.key}
                    onChange={(v) => setField(group.key, idx, v)}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-2xs flex items-center gap-xs">
            <Button
              label={busyGroup === group.key ? 'Gerando…' : 'Gerar com IA'}
              variant="secondary"
              size="sm"
              icon={Sparkles}
              iconPosition="left"
              disabled={ai.status === 'loading' || filledObjectives.length === 0}
              onClick={() => void generateGroup(group.key)}
            />
            {undoableGroups[group.key] && (
              <Button
                label="Desfazer"
                variant="ghost"
                size="sm"
                onClick={() => undoGroup(group.key)}
              />
            )}
          </div>
          {errorGroup === group.key && ai.status === 'error' && ai.errorMessage && (
            <p className="typo-body-sm text-inactive">{ai.errorMessage}</p>
          )}
        </div>
      ))}
    </div>
  )
}
