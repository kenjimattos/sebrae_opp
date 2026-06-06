import TextInput from '@/components/ui/TextInput'
import { useFormulator } from '@/hooks/useFormulator'

export default function StepJustification() {
  const { state, setSlice } = useFormulator()
  const data = state.justification

  const update = (patch: Partial<typeof data>) =>
    setSlice('justification', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Problema central"
        subtitle="💡 Use dados do diagnóstico para fundamentar."
        hint="Descreva o problema que quer resolver"
        multiline
        rows={2}
        value={data.problem}
        onChange={(v) => update({ problem: v })}
      />
      <TextInput
        title="Evidências e Dados"
        hint="Indicadores, pesquisas e dados que comprovam o problema..."
        multiline
        rows={2}
        value={data.evidence}
        onChange={(v) => update({ evidence: v })}
      />
      <TextInput
        title="Impacto da Inação"
        hint="O que acontece se o problema não for resolvido?"
        multiline
        rows={2}
        value={data.impact}
        onChange={(v) => update({ impact: v })}
      />
      <TextInput
        title="Política pública associada"
        hint="Qual política pública nova ou existente esse projeto está associado?"
        multiline
        rows={2}
        value={data.policy}
        onChange={(v) => update({ policy: v })}
      />
    </div>
  )
}
