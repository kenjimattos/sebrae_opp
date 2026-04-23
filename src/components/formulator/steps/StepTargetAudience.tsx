import TextInput from '@/components/ui/TextInput'
import { useFormulator } from '@/hooks/useFormulator'

export default function StepTargetAudience() {
  const { state, setSlice } = useFormulator()
  const data = state.targetAudience

  const update = (patch: Partial<typeof data>) =>
    setSlice('targetAudience', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Público-alvo Principal"
        hint="Quem são os beneficiários diretos?"
        multiline
        rows={3}
        value={data.primary}
        onChange={(v) => update({ primary: v })}
      />
      <TextInput
        title="Público Secundário"
        hint="Beneficiários indiretos e parceiros do projeto"
        multiline
        rows={3}
        value={data.secondary}
        onChange={(v) => update({ secondary: v })}
      />
      <TextInput
        title="Estimativa de beneficiários"
        hint="Ex.: 200 MPEs impactadas e 50 jovens capacitados"
        value={data.estimate}
        onChange={(v) => update({ estimate: v })}
      />
    </div>
  )
}
