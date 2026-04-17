import TextInput from '@/components/ui/TextInput'
import { useFormulador } from '@/hooks/useFormulador'

export default function StepJustificativa() {
  const { state, setSlice } = useFormulador()
  const data = state.justificativa

  const update = (patch: Partial<typeof data>) =>
    setSlice('justificativa', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Problema central"
        subtitle="💡 Use dados do diagnóstico para fundamentar."
        hint="Descreva o problema que quer resolver"
        multiline
        rows={4}
        value={data.problema}
        onChange={(v) => update({ problema: v })}
      />
      <TextInput
        title="Evidências e Dados"
        hint="Indicadores, pesquisas e dados que comprovam o problema..."
        multiline
        rows={4}
        value={data.evidencias}
        onChange={(v) => update({ evidencias: v })}
      />
      <TextInput
        title="Impacto da Inação"
        hint="O que acontece se o problema não for resolvido?"
        multiline
        rows={4}
        value={data.impacto}
        onChange={(v) => update({ impacto: v })}
      />
    </div>
  )
}
