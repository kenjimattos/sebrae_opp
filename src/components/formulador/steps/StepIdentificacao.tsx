import TextInput from '@/components/ui/TextInput'
import Dropdown from '@/components/ui/Dropdown'
import { useFormulador } from '@/hooks/useFormulador'
import { useMunicipio } from '@/hooks/useMunicipio'
import municipios from '@/data/indicadores/municipios.json'

export default function StepIdentificacao() {
  const { state, setSlice } = useFormulador()
  const { municipio, setMunicipio } = useMunicipio()
  const data = state.identificacao

  const update = (patch: Partial<typeof data>) =>
    setSlice('identificacao', { ...data, ...patch })

  const municipioOptions = municipios.map((m) => ({ label: m.nome, value: m.id }))

  function handleMunicipioChange(id: string) {
    const match = municipios.find((m) => m.id === id)
    if (match) setMunicipio(match.id, match.nome)
  }

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        title="Título do Projeto"
        hint="Ex: Programa Municipal de Digitalização de MPEs"
        value={data.titulo}
        onChange={(v) => update({ titulo: v })}
      />

      <div className="flex flex-col gap-xs">
        <label className="typo-body-bold">Município</label>
        <Dropdown
          options={municipioOptions}
          value={municipio.id}
          onChange={handleMunicipioChange}
          ButtonVariant="secondary"
        />
      </div>

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
