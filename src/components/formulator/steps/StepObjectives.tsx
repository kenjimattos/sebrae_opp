import TextInput from '@/components/ui/TextInput'
import Button from '@/components/ui/buttons/Button'
import IconButton from '@/components/ui/buttons/IconButton'
import { Plus, Trash2 } from '@/components/icons'
import { useFormulator } from '@/hooks/useFormulator'

export default function StepObjectives() {
  const { state, setSlice } = useFormulator()
  const data = state.objectives

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

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Objetivo Geral"
        subtitle="💡 Deve estar diretamente conectado ao problema da justificativa."
        hint="O que o projeto pretende alcançar de forma ampla"
        multiline
        rows={3}
        value={data.general}
        onChange={setGeneral}
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
        <div className="mt-xs">
          <Button
            label="Adicionar objetivo"
            variant="ghost"
            size="sm"
            icon={Plus}
            iconPosition="left"
            onClick={addSpecific}
          />
        </div>
      </div>
    </div>
  )
}
