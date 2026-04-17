import TextInput from '@/components/ui/TextInput'
import { useFormulador } from '@/hooks/useFormulador'

export default function StepPlanoAcao() {
  const { state, setSlice } = useFormulador()
  const data = state.planoAcao

  const update = (patch: Partial<typeof data>) =>
    setSlice('planoAcao', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Atividades Previstas"
        subtitle="💡 Cada atividade deve estar conectada a um objetivo específico."
        hint="Quais ações serão realizadas?"
        multiline
        rows={4}
        value={data.atividades}
        onChange={(v) => update({ atividades: v })}
      />
      <TextInput
        title="Metodologia"
        hint="Como as atividades serão executadas?"
        multiline
        rows={4}
        value={data.metodologia}
        onChange={(v) => update({ metodologia: v })}
      />
    </div>
  )
}
