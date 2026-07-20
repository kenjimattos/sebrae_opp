import AiField from '@/components/formulator/AiField'
import TextInput from '@/components/ui/TextInput'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'

export default function StepTargetAudience() {
  const { state, setSlice } = useFormulator()
  const { municipality } = useMunicipality()
  const data = state.targetAudience

  const update = (patch: Partial<typeof data>) =>
    setSlice('targetAudience', { ...data, ...patch })

  const municipalityCtx = { id: municipality.id, name: municipality.name }

  return (
    <div className="flex flex-col gap-md">
      <AiField
        title="Público-alvo Principal"
        hint="Quem são os beneficiários diretos?"
        multiline
        rows={3}
        value={data.primary}
        onChange={(v) => update({ primary: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'targetAudience.primary',
          text,
          municipality: municipalityCtx,
          context: {
            problema: state.justification.problem,
            objetivoGeral: state.objectives.general,
          },
        })}
      />
      <AiField
        title="Público Secundário"
        hint="Beneficiários indiretos e parceiros do projeto"
        multiline
        rows={3}
        value={data.secondary}
        onChange={(v) => update({ secondary: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'targetAudience.secondary',
          text,
          municipality: municipalityCtx,
          context: {
            publicoPrincipal: data.primary,
            objetivoGeral: state.objectives.general,
          },
        })}
      />
      {/* Sem IA: campo semi-numérico — o modelo inventaria quantidades. */}
      <TextInput
        title="Estimativa de beneficiários"
        hint="Ex.: 200 MPEs impactadas e 50 jovens capacitados"
        value={data.estimate}
        onChange={(v) => update({ estimate: v })}
      />
    </div>
  )
}
