import TextInput from '@/components/ui/TextInput'
import { useFormulator } from '@/hooks/useFormulator'

export default function StepSustainability() {
  const { state, setSlice } = useFormulator()
  const data = state.sustainability

  const update = (patch: Partial<typeof data>) =>
    setSlice('sustainability', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Estratégia de Continuidade"
        hint="Como os resultados serão mantidos após o término do projeto?"
        multiline
        rows={4}
        value={data.continuity}
        onChange={(v) => update({ continuity: v })}
      />
      <TextInput
        title="Parcerias Institucionais"
        hint="Quais parcerias garantem a sustentabilidade?"
        multiline
        rows={4}
        value={data.partnerships}
        onChange={(v) => update({ partnerships: v })}
      />
    </div>
  )
}
