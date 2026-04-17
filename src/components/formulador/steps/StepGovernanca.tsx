import TextInput from '@/components/ui/TextInput'
import { useFormulador } from '@/hooks/useFormulador'

export default function StepGovernanca() {
  const { state, setSlice } = useFormulador()
  const data = state.governanca

  const update = (patch: Partial<typeof data>) =>
    setSlice('governanca', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Estrutura de Gestão"
        subtitle="💡 Devem estar conectados aos objetivos definidos."
        hint="Quem gerencia o projeto? Comitês, equipes..."
        multiline
        rows={4}
        value={data.gestao}
        onChange={(v) => update({ gestao: v })}
      />
      <TextInput
        title="Monitoramento e Avaliação"
        hint="Como será feito o acompanhamento?"
        multiline
        rows={4}
        value={data.monitoramento}
        onChange={(v) => update({ monitoramento: v })}
      />
      <TextInput
        title="Prestação de Contas"
        hint="Relatórios, frequência, responsáveis..."
        multiline
        rows={4}
        value={data.prestacaoContas}
        onChange={(v) => update({ prestacaoContas: v })}
      />
    </div>
  )
}
