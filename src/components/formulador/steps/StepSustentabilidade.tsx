import TextInput from '@/components/ui/TextInput'
import { useFormulador } from '@/hooks/useFormulador'

export default function StepSustentabilidade() {
  const { state, setSlice } = useFormulador()
  const data = state.sustentabilidade

  const update = (patch: Partial<typeof data>) =>
    setSlice('sustentabilidade', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Estratégia de Continuidade"
        hint="Como os resultados serão mantidos após o término do projeto?"
        multiline
        rows={4}
        value={data.continuidade}
        onChange={(v) => update({ continuidade: v })}
      />
      <TextInput
        title="Parcerias Institucionais"
        hint="Quais parcerias garantem a sustentabilidade?"
        multiline
        rows={4}
        value={data.parcerias}
        onChange={(v) => update({ parcerias: v })}
      />
    </div>
  )
}
