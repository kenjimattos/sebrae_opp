import TextInput from '@/components/ui/TextInput'
import { useFormulator } from '@/hooks/useFormulator'

export default function StepGovernance() {
  const { state, setSlice } = useFormulator()
  const data = state.governance

  const update = (patch: Partial<typeof data>) =>
    setSlice('governance', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Estrutura de Gestão"
        subtitle="💡 Devem estar conectados aos objetivos definidos."
        hint="Quem gerencia o projeto? Comitês, equipes..."
        multiline
        rows={3}
        value={data.management}
        onChange={(v) => update({ management: v })}
      />
      <TextInput
        title="Monitoramento e Avaliação"
        hint="Como será feito o acompanhamento?"
        multiline
        rows={3}
        value={data.monitoring}
        onChange={(v) => update({ monitoring: v })}
      />
      <TextInput
        title="Prestação de Contas"
        hint="Relatórios, frequência, responsáveis..."
        multiline
        rows={3}
        value={data.accountability}
        onChange={(v) => update({ accountability: v })}
      />
    </div>
  )
}
