import TextInput from '@/components/ui/TextInput'
import { useFormulador } from '@/hooks/useFormulador'

export default function StepIdentificacao() {
  const { state, setSlice } = useFormulador()
  const data = state.identificacao

  const update = (patch: Partial<typeof data>) =>
    setSlice('identificacao', { ...data, ...patch })

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Título do Projeto"
        hint="Ex: Programa Municipal de Digitalização de MPEs"
        value={data.titulo}
        onChange={(v) => update({ titulo: v })}
      />
      <TextInput
        title="Município"
        hint="Ex.: Campina Grande"
        value={data.municipio}
        onChange={(v) => update({ municipio: v })}
      />
      <TextInput
        title="Responsável"
        hint="Nome do gestor ou coordenador"
        value={data.responsavel}
        onChange={(v) => update({ responsavel: v })}
      />
      <TextInput
        title="Órgão Executor"
        hint="Secretária ou órgão responsável"
        value={data.orgao}
        onChange={(v) => update({ orgao: v })}
      />
      <TextInput
        title="Duração Prevista"
        hint="Ex.: 12 meses"
        value={data.duracao}
        onChange={(v) => update({ duracao: v })}
      />
    </div>
  )
}
