import TextInput from '@/components/ui/TextInput'
import { useFormulador } from '@/hooks/useFormulador'

export default function StepPublicoAlvo() {
  const { state, setSlice } = useFormulador()
  const data = state.publicoAlvo

  const update = (patch: Partial<typeof data>) =>
    setSlice('publicoAlvo', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Público-alvo Principal"
        hint="Quem são os beneficiários diretos?"
        multiline
        rows={3}
        value={data.principal}
        onChange={(v) => update({ principal: v })}
      />
      <TextInput
        title="Público Secundário"
        hint="Beneficiários indiretos e parceiros do projeto"
        multiline
        rows={3}
        value={data.secundario}
        onChange={(v) => update({ secundario: v })}
      />
      <TextInput
        title="Estimativa de beneficiários"
        hint="Ex.: 200 MPEs impactadas e 50 jovens capacitados"
        value={data.estimativa}
        onChange={(v) => update({ estimativa: v })}
      />
    </div>
  )
}
