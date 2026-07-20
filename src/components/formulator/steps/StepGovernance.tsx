import AiField from '@/components/formulator/AiField'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'

export default function StepGovernance() {
  const { state, setSlice } = useFormulator()
  const { municipality } = useMunicipality()
  const data = state.governance

  const update = (patch: Partial<typeof data>) =>
    setSlice('governance', { ...data, ...patch })

  const municipalityCtx = { id: municipality.id, name: municipality.name }
  const specificObjectives = state.objectives.specific.filter(Boolean).join('; ')

  // Indicadores já definidos na etapa 7 — fundamentam a rotina de
  // monitoramento gerada pela IA.
  const projectIndicators = [...state.indicators.results, ...state.indicators.impact]
    .filter(Boolean)
    .join('; ')

  return (
    <div className="flex flex-col gap-md">
      <AiField
        title="Estrutura de Gestão"
        subtitle="💡 Devem estar conectados aos objetivos definidos."
        hint="Quem gerencia o projeto? Comitês, equipes..."
        multiline
        rows={3}
        value={data.management}
        onChange={(v) => update({ management: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'governance.management',
          text,
          municipality: municipalityCtx,
          context: {
            atividades: state.actionPlan.activities,
            parcerias: state.sustainability.partnerships,
          },
        })}
      />
      <AiField
        title="Monitoramento e Avaliação"
        hint="Como será feito o acompanhamento?"
        multiline
        rows={3}
        value={data.monitoring}
        onChange={(v) => update({ monitoring: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'governance.monitoring',
          text,
          municipality: municipalityCtx,
          context: {
            objetivosEspecificos: specificObjectives,
            gestao: data.management,
            ...(projectIndicators !== '' ? { indicadoresProjeto: projectIndicators } : {}),
          },
        })}
      />
      <AiField
        title="Prestação de Contas"
        hint="Relatórios, frequência, responsáveis..."
        multiline
        rows={3}
        value={data.accountability}
        onChange={(v) => update({ accountability: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'governance.accountability',
          text,
          municipality: municipalityCtx,
          context: {
            gestao: data.management,
            monitoramento: data.monitoring,
          },
        })}
      />
    </div>
  )
}
