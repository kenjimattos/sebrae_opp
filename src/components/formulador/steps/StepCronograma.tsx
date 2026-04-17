import TextInput from '@/components/ui/TextInput'
import { useFormulador } from '@/hooks/useFormulador'

export default function StepCronograma() {
  const { state, setSlice } = useFormulador()
  const data = state.cronograma

  const update = (patch: Partial<typeof data>) =>
    setSlice('cronograma', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Fases do projeto"
        hint="Divida o projeto em fases com períodos (ex: Mês 1-3 planejamento...)"
        multiline
        rows={4}
        value={data.fases}
        onChange={(v) => update({ fases: v })}
      />
      <TextInput
        title="Marcos e Entregas"
        hint="Principais marcos e entregas de cada fase"
        multiline
        rows={4}
        value={data.marcos}
        onChange={(v) => update({ marcos: v })}
      />
    </div>
  )
}
