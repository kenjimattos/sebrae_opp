import AiField from '@/components/formulator/AiField'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'

export default function StepTimeline() {
  const { state, setSlice } = useFormulator()
  const { municipality } = useMunicipality()
  const data = state.timeline

  const update = (patch: Partial<typeof data>) =>
    setSlice('timeline', { ...data, ...patch })

  const municipalityCtx = { id: municipality.id, name: municipality.name }

  return (
    <div className="flex flex-col gap-md">
      <AiField
        title="Fases do projeto"
        hint="Divida o projeto em fases com períodos (ex: Mês 1-3 planejamento...)"
        multiline
        rows={4}
        value={data.phases}
        onChange={(v) => update({ phases: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'timeline.phases',
          text,
          municipality: municipalityCtx,
          context: {
            atividades: state.actionPlan.activities,
            duracao: state.identification.duration,
          },
        })}
      />
      <AiField
        title="Marcos e Entregas"
        hint="Principais marcos e entregas de cada fase"
        multiline
        rows={4}
        value={data.milestones}
        onChange={(v) => update({ milestones: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'timeline.milestones',
          text,
          municipality: municipalityCtx,
          context: {
            fases: data.phases,
            atividades: state.actionPlan.activities,
          },
        })}
      />
    </div>
  )
}
