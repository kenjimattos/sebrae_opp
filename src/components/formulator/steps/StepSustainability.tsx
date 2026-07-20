import AiField from '@/components/formulator/AiField'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'

export default function StepSustainability() {
  const { state, setSlice } = useFormulator()
  const { municipality } = useMunicipality()
  const data = state.sustainability

  const update = (patch: Partial<typeof data>) =>
    setSlice('sustainability', { ...data, ...patch })

  const municipalityCtx = { id: municipality.id, name: municipality.name }

  return (
    <div className="flex flex-col gap-md">
      <AiField
        title="Estratégia de Continuidade"
        hint="Como os resultados serão mantidos após o término do projeto?"
        multiline
        rows={4}
        value={data.continuity}
        onChange={(v) => update({ continuity: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'sustainability.continuity',
          text,
          municipality: municipalityCtx,
          context: {
            objetivoGeral: state.objectives.general,
            atividades: state.actionPlan.activities,
            parcerias: data.partnerships,
          },
        })}
      />
      <AiField
        title="Parcerias Institucionais"
        hint="Quais parcerias garantem a sustentabilidade?"
        multiline
        rows={4}
        value={data.partnerships}
        onChange={(v) => update({ partnerships: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'sustainability.partnerships',
          text,
          municipality: municipalityCtx,
          context: {
            atividades: state.actionPlan.activities,
            continuidade: data.continuity,
            publicoAlvo: state.targetAudience.primary,
          },
        })}
      />
    </div>
  )
}
