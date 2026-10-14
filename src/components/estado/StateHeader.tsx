// Título da visão estadual com o nome da UF como seletor:
// "visão estadual da [Paraíba ▾]". A preposição sai da tabela de
// `data/geo/ufs.ts` e acompanha a UF mostrada — "do Ceará", "de Pernambuco".
//
// Controlado: quem monta decide o que fazer com `onChange`. Na Home só a
// Paraíba tem dados, então as outras UFs vêm marcadas "(em breve)" e a
// SectionEstado ignora a escolha — trocar o nome sem trocar os números faria
// o título mentir sobre os cards.
import { ChevronDown, iconSizes } from '@/components/icons'
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
    <h1 className={`typo-h1 flex flex-wrap items-baseline justify-center gap-x-sm ${className}`}>
      <span>
        {title} {uf?.preposicao ?? 'de'}
      </span>
      <span ref={ref} className="relative z-10 inline-flex">
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${uf?.name ?? ''}, trocar estado`}
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-xs rounded-sm underline decoration-accent decoration-2 underline-offset-8 hover:text-accent focus-visible:outline outline-2 outline-offset-2 outline-accent"
        >
          {uf?.name}
          <ChevronDown size={iconSizes.xl} className="text-accent" />
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
