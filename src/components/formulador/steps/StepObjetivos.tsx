import TextInput from '@/components/ui/TextInput'
import Button from '@/components/ui/buttons/Button'
import { Plus } from '@/components/icons'
import { useFormulador } from '@/hooks/useFormulador'

export default function StepObjetivos() {
  const { state, setSlice } = useFormulador()
  const data = state.objetivos

  const setGeral = (geral: string) => setSlice('objetivos', { ...data, geral })

  const setEspecifico = (idx: number, value: string) => {
    const especificos = [...data.especificos]
    especificos[idx] = value
    setSlice('objetivos', { ...data, especificos })
  }

  const addEspecifico = () =>
    setSlice('objetivos', { ...data, especificos: [...data.especificos, ''] })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Objetivo Geral"
        subtitle="💡 Deve estar diretamente conectado ao problema da justificativa."
        hint="O que o projeto pretende alcançar de forma ampla"
        multiline
        rows={3}
        value={data.geral}
        onChange={setGeral}
      />

      <div className="flex flex-col gap-xs">
        <label className="typo-body-bold">Objetivos Específicos</label>
        <p className="typo-body-sm">💡 Liste os objetivos específicos (um por linha)</p>
        <div className="flex flex-col gap-sm">
          {data.especificos.map((texto, idx) => (
            <TextInput
              key={idx}
              value={texto}
              hint={`Objetivo ${idx + 1}`}
              onChange={(v) => setEspecifico(idx, v)}
            />
          ))}
        </div>
        <div className="mt-xs">
          <Button
            label="Adicionar objetivo"
            variant="ghost"
            size="sm"
            icon={Plus}
            iconPosition="left"
            onClick={addEspecifico}
          />
        </div>
      </div>
    </div>
  )
}
