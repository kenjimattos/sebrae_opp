import { useRef, useState } from 'react'
import TextInput from '@/components/ui/TextInput'
import Button from '@/components/ui/buttons/Button'
import IconButton from '@/components/ui/buttons/IconButton'
import AiField from '@/components/formulator/AiField'
import { Plus, Sparkles, Trash2 } from '@/components/icons'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useAiTask } from '@/hooks/useAiTask'

export default function StepObjectives() {
  const { state, setSlice } = useFormulator()
  const { municipality } = useMunicipality()
  const data = state.objectives

  // Geração de objetivos específicos a partir do objetivo geral (IA).
  const specificAi = useAiTask()
  const previousSpecific = useRef<string[] | null>(null)
  const [showUndoSpecific, setShowUndoSpecific] = useState(false)

  const setGeneral = (general: string) => setSlice('objectives', { ...data, general })

  const setSpecific = (idx: number, value: string) => {
    const specific = [...data.specific]
    specific[idx] = value
    setSlice('objectives', { ...data, specific })
  }

  const addSpecific = () =>
    setSlice('objectives', { ...data, specific: [...data.specific, ''] })

  const removeSpecific = (idx: number) =>
    setSlice('objectives', {
      ...data,
      specific: data.specific.filter((_, i) => i !== idx),
    })

  const canRemove = data.specific.length > 1

  async function generateSpecific() {
    if (specificAi.status === 'loading' || data.general.trim() === '') return
    previousSpecific.current = data.specific
    setShowUndoSpecific(false)
    const result = await specificAi.run({
      task: 'generate-specific-objectives',
      general: data.general,
      municipality: { id: municipality.id, name: municipality.name },
      count: 4,
    })
    // O parse em items[] acontece no servidor (handler.ts) — sem typewriter
    // aqui: arrays de inputs não animam bem; a lista aparece preenchida.
    if (result?.items && result.items.length > 0) {
      setSlice('objectives', { ...data, specific: result.items })
      setShowUndoSpecific(true)
    }
  }

  function undoSpecific() {
    if (previousSpecific.current) {
      setSlice('objectives', { ...data, specific: previousSpecific.current })
    }
    setShowUndoSpecific(false)
  }

  return (
    <div className="flex flex-col gap-md">
      <AiField
        title="Objetivo Geral"
        subtitle="💡 Deve estar diretamente conectado ao problema da justificativa."
        hint="O que o projeto pretende alcançar de forma ampla"
        multiline
        rows={3}
        value={data.general}
        onChange={setGeneral}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'objectives.general',
          text,
          municipality: { id: municipality.id, name: municipality.name },
          context: { problema: state.justification.problem },
        })}
      />

      <div className="flex flex-col gap-xs">
        <label className="typo-body-bold">Objetivos Específicos</label>
        <p className="typo-body-sm">💡 Liste os objetivos específicos (um por linha)</p>
        <div className="flex flex-col gap-sm">
          {data.specific.map((texto, idx) => (
            <div key={idx} className="flex items-start gap-xs">
              <TextInput
                value={texto}
                hint={`Objetivo ${idx + 1}`}
                onChange={(v) => setSpecific(idx, v)}
              />
              {canRemove && (
                <IconButton
                  icon={Trash2}
                  aria-label={`Remover objetivo ${idx + 1}`}
                  variant="ghost"
                  size="md"
                  onClick={() => removeSpecific(idx)}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-xs flex items-center gap-xs">
          <Button
            label="Adicionar objetivo"
            variant="ghost"
            size="sm"
            icon={Plus}
            iconPosition="left"
            onClick={addSpecific}
          />
          <Button
            label={specificAi.status === 'loading' ? 'Gerando…' : 'Gerar objetivos específicos com IA'}
            variant="secondary"
            size="sm"
            icon={Sparkles}
            iconPosition="left"
            disabled={specificAi.status === 'loading' || data.general.trim() === ''}
            onClick={() => void generateSpecific()}
          />
          {showUndoSpecific && (
            <Button label="Desfazer" variant="ghost" size="sm" onClick={undoSpecific} />
          )}
        </div>
        {specificAi.status === 'error' && specificAi.errorMessage && (
          <p className="typo-body-sm text-inactive">{specificAi.errorMessage}</p>
        )}
      </div>
    </div>
  )
}
