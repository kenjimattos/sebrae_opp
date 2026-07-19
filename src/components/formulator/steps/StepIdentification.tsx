import TextInput from '@/components/ui/TextInput'
import Dropdown from '@/components/ui/Dropdown'
import AiField from '@/components/formulator/AiField'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'

export default function StepIdentification() {
  const { state, setSlice } = useFormulator()
  const { municipality, municipalities, setMunicipality } = useMunicipality()
  const data = state.identification

  const update = (patch: Partial<typeof data>) =>
    setSlice('identification', { ...data, ...patch })

  const municipalityOptions = municipalities.map((m) => ({ label: m.name, value: m.id }))

  function handleMunicipalityChange(id: string) {
    const match = municipalities.find((m) => m.id === id)
    if (match) setMunicipality(match.id, match.name)
  }

  return (
    <div className="flex flex-col gap-md">
      <AiField
        title="Título do Projeto"
        hint="Ex: Programa Municipal de Digitalização de MPEs"
        value={data.title}
        onChange={(v) => update({ title: v })}
        buildRequest={(text) => ({
          task: 'improve-field',
          field: 'identification.title',
          text,
          municipality: { id: municipality.id, name: municipality.name },
        })}
      />

      <div className="flex flex-col gap-xs">
        <label className="typo-body-bold">Município</label>
        <Dropdown
          options={municipalityOptions}
          value={municipality.id}
          onChange={handleMunicipalityChange}
          ButtonVariant="secondary"
        />
      </div>

      <TextInput
        title="Responsável"
        hint="Nome do gestor ou coordenador"
        value={data.responsible}
        onChange={(v) => update({ responsible: v })}
      />
      <TextInput
        title="Órgão Executor"
        hint="Secretária ou órgão responsável"
        value={data.organization}
        onChange={(v) => update({ organization: v })}
      />
      <TextInput
        title="Duração Prevista"
        hint="Ex.: 12 meses"
        value={data.duration}
        onChange={(v) => update({ duration: v })}
      />
    </div>
  )
}
