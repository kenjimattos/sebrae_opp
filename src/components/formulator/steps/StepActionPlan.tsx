import AiField from '@/components/formulator/AiField'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'

export default function StepActionPlan() {
  const { state, setSlice } = useFormulator()
  const { municipality } = useMunicipality()
  const data = state.actionPlan

  const update = (patch: Partial<typeof data>) =>
    setSlice('actionPlan', { ...data, ...patch })

  const municipalityCtx = { id: municipality.id, name: municipality.name }
  const specificObjectives = state.objectives.specific.filter(Boolean).join('; ')

  return (
    <div className="flex flex-col gap-md">
      <AiField
        title="Atividades Previstas"
        subtitle="💡 Cada atividade deve estar conectada a um objetivo específico."
        hint="Quais ações serão realizadas?"
        multiline
        rows={4}
        value={data.activities}
        onChange={(v) => update({ activities: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'actionPlan.activities',
          text,
          municipality: municipalityCtx,
          context: {
            objetivoGeral: state.objectives.general,
            objetivosEspecificos: specificObjectives,
            publicoAlvo: state.targetAudience.primary,
          },
        })}
      />
      <AiField
        title="Metodologia"
        hint="Como as atividades serão executadas?"
        multiline
        rows={4}
        value={data.methodology}
        onChange={(v) => update({ methodology: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'actionPlan.methodology',
          text,
          municipality: municipalityCtx,
          context: {
            atividades: data.activities,
            objetivoGeral: state.objectives.general,
          },
        })}
      />
    </div>
  )
}
