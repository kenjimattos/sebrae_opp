// Título da visão estadual com o nome da UF como seletor:
// "visão estadual da [Paraíba ▾]" — o nome numa pílula de acento, com o rótulo
// "selecione estado" pequeno acima dela. A preposição sai da tabela de
// `data/geo/ufs.ts` e acompanha a UF mostrada — "do Ceará", "de Pernambuco".
//
// Controlado: quem monta decide o que fazer com `onChange`. Na Home só a
// Paraíba tem dados, então as outras UFs vêm marcadas "(em breve)" e a
// SectionEstado ignora a escolha — trocar o nome sem trocar os números faria
// o título mentir sobre os cards.
import DropdownMenu from '@/components/ui/DropdownMenu'
import { useDropdownState } from '@/components/ui/useDropdownState'
import { UFS } from '@/data/geo/ufs'

interface StateHeaderProps {
  /** Texto antes da preposição, ex.: "visão estadual". */
  title: string
  /** Código IBGE da UF mostrada. */
  value: string
  onChange: (id: string) => void
  /** UFs que podem ser escolhidas; as demais saem com "(em breve)". Default: todas. */
  available?: string[]
  className?: string
}

export default function StateHeader({
  title,
  value,
  onChange,
  available,
  className = '',
}: StateHeaderProps) {
  const { open, setOpen, ref } = useDropdownState()
  const uf = UFS.find((u) => u.id === value)

  const options = UFS.map((u) => ({
    label: !available || available.includes(u.id) ? u.name : `${u.name} (em breve)`,
    value: u.id,
  }))

  function handleSelect(id: string) {
    setOpen(false)
    onChange(id)
  }

  return (
    <h1 className={`typo-h1 flex flex-wrap items-center justify-center gap-x-md gap-y-lg ${className}`}>
      <span>
        {title} {uf?.preposicao ?? 'de'}
      </span>
      <span ref={ref} className="relative z-10 inline-flex">
        {/* Rótulo fora do fluxo: fica sobre a pílula sem empurrar o título
            para baixo. aria-hidden porque o aria-label do botão já o diz. */}
        <span
          aria-hidden="true"
          className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2xs typo-body-sm whitespace-nowrap"
        >
          selecione estado
        </span>
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${uf?.name ?? ''}, trocar estado`}
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-xs rounded-full bg-accent hover:bg-accent-hover text-on-accent px-md pt-xs pb-2xs transition-colors focus-visible:outline outline-2 outline-offset-2 outline-accent"
        >
          {uf?.name}
          {/* Seta cheia, como no Figma — o ChevronDown do lucide é só traço. */}
          <svg aria-hidden="true" viewBox="0 0 12 10" className="w-[0.4em] h-auto" fill="currentColor">
            <path d="M0 0h12L6 10z" />
          </svg>
        </button>
        {open && (
          <DropdownMenu
            options={options}
            value={value}
            onSelect={handleSelect}
          />
        )}
      </span>
    </h1>
  )
}
