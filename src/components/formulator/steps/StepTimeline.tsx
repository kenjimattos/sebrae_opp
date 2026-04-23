import TextInput from '@/components/ui/TextInput'
import { useFormulator } from '@/hooks/useFormulator'

export default function StepTimeline() {
  const { state, setSlice } = useFormulator()
  const data = state.timeline

  const update = (patch: Partial<typeof data>) =>
    setSlice('timeline', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Fases do projeto"
        hint="Divida o projeto em fases com períodos (ex: Mês 1-3 planejamento...)"
        multiline
        rows={4}
        value={data.phases}
        onChange={(v) => update({ phases: v })}
      />
      <TextInput
        title="Marcos e Entregas"
        hint="Principais marcos e entregas de cada fase"
        multiline
        rows={4}
        value={data.milestones}
        onChange={(v) => update({ milestones: v })}
      />
    </div>
  )
}
