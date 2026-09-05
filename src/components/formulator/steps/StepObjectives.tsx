import TextInput from '@/components/ui/TextInput'
import Button from '@/components/ui/buttons/Button'
import IconButton from '@/components/ui/buttons/IconButton'
import AiField from '@/components/formulator/AiField'
import AiActionBar from '@/components/formulator/AiActionBar'
import { Plus, Trash2 } from '@/components/icons'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useAiTask } from '@/hooks/useAiTask'
import { useConfirm } from '@/hooks/useConfirm'
import { confirmReplaceList, filledCount } from '@/utils/formulatorOverwrite'
import { useUndoable } from '@/hooks/useUndoable'

export default function StepObjectives() {
  const { state, setSlice } = useFormulator()
  const { municipality } = useMunicipality()
  const data = state.objectives

  // Geração de objetivos específicos a partir do objetivo geral (IA).
  const specificAi = useAiTask()
  const undoableSpecific = useUndoable<string[]>()
  const confirm = useConfirm()

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
    // Substitui a lista inteira; só pergunta se houver objetivo digitado.
    const preenchidos = filledCount(data.specific)
    if (preenchidos > 0 && !(await confirm(confirmReplaceList(preenchidos, 'objetivo específico', 'objetivos específicos')))) return
    undoableSpecific.capture(data.specific)
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
      undoableSpecific.arm()
    }
  }

  function undoSpecific() {
    const previous = undoableSpecific.undo()
    if (previous) setSlice('objectives', { ...data, specific: previous })
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
        <AiActionBar
          label="Gerar objetivos específicos com IA"
          loading={specificAi.status === 'loading'}
          disabled={specificAi.status === 'loading' || data.general.trim() === ''}
          onGenerate={() => void generateSpecific()}
          onUndo={undoableSpecific.canUndo ? undoSpecific : undefined}
          errorMessage={specificAi.status === 'error' ? specificAi.errorMessage : null}
        >
          <Button
            label="Adicionar objetivo"
            variant="ghost"
            size="sm"
            icon={Plus}
            iconPosition="left"
            onClick={addSpecific}
          />
        </AiActionBar>
      </div>
    </div>
  )
}
