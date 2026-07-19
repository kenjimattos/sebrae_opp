import AiField from '@/components/formulator/AiField'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'
import { selectTopRisks } from '@/utils/risks'
import { statusLabels } from '@/data/indicators/status-labels'

export default function StepJustification() {
  const { state, setSlice } = useFormulator()
  const { municipality } = useMunicipality()
  const data = state.justification

  const update = (patch: Partial<typeof data>) =>
    setSlice('justification', { ...data, ...patch })

  const municipalityCtx = { id: municipality.id, name: municipality.name }

  // Indicadores em alerta/atenção do município — fundamentam as "Evidências e
  // Dados" geradas pela IA com dados reais do diagnóstico.
  const risksSummary = selectTopRisks(municipality.data?.agendas ?? [], 5)
    .map((r) => `${r.label}: ${r.value} (${statusLabels[r.status]})`)
    .join('; ')

  return (
    <div className="flex flex-col gap-md">
      <AiField
        title="Problema central"
        subtitle="💡 Use dados do diagnóstico para fundamentar."
        hint="Descreva o problema que quer resolver"
        multiline
        rows={2}
        value={data.problem}
        onChange={(v) => update({ problem: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'justification.problem',
          text,
          municipality: municipalityCtx,
        })}
      />
      <AiField
        title="Evidências e Dados"
        hint="Indicadores, pesquisas e dados que comprovam o problema..."
        multiline
        rows={2}
        value={data.evidence}
        onChange={(v) => update({ evidence: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'justification.evidence',
          text,
          municipality: municipalityCtx,
          context: {
            problema: data.problem,
            ...(risksSummary !== '' ? { indicadores: risksSummary } : {}),
          },
        })}
      />
      <AiField
        title="Impacto da Inação"
        hint="O que acontece se o problema não for resolvido?"
        multiline
        rows={2}
        value={data.impact}
        onChange={(v) => update({ impact: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'justification.impact',
          text,
          municipality: municipalityCtx,
          context: { problema: data.problem },
        })}
      />
      <AiField
        title="Política pública associada"
        hint="Qual política pública nova ou existente esse projeto está associado?"
        multiline
        rows={2}
        value={data.policy}
        onChange={(v) => update({ policy: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'justification.policy',
          text,
          municipality: municipalityCtx,
          context: { problema: data.problem },
        })}
      />
    </div>
  )
}
