import TextInput from '@/components/ui/TextInput'
import { useFormulator } from '@/hooks/useFormulator'

export default function StepActionPlan() {
  const { state, setSlice } = useFormulator()
  const data = state.actionPlan

  const update = (patch: Partial<typeof data>) =>
    setSlice('actionPlan', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Atividades Previstas"
        subtitle="💡 Cada atividade deve estar conectada a um objetivo específico."
        hint="Quais ações serão realizadas?"
        multiline
        rows={4}
        value={data.activities}
        onChange={(v) => update({ activities: v })}
      />
      <TextInput
        title="Metodologia"
        hint="Como as atividades serão executadas?"
        multiline
        rows={4}
        value={data.methodology}
        onChange={(v) => update({ methodology: v })}
      />
    </div>
  )
}
