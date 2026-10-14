// Seletor de UF da entrada. Mesma casca do CitySelector (pílula glass com o
// rótulo em Button), mas sem busca: são 27 opções e só uma está aberta.
//
// A seleção é FIXA na Paraíba. As outras UFs aparecem na lista para dizer que
// a plataforma é nacional no desenho, mas escolher uma não muda nada — fecha o
// menu e a Paraíba segue marcada. Escolher a Paraíba é o que entra na Home.
import { ChevronDown } from '@/components/icons'
import DropdownMenu from '@/components/ui/DropdownMenu'
import { useDropdownState } from '@/components/ui/useDropdownState'
import Button from '../ui/buttons/Button'
import { PB_UF_ID, UFS } from '@/data/geo/ufs'

interface StateSelectorProps {
  onEnter: () => void
  className?: string
}

const options = UFS.map((uf) => ({
  label: uf.id === PB_UF_ID ? uf.name : `${uf.name} (em breve)`,
  value: uf.id,
}))

const pbName = UFS.find((uf) => uf.id === PB_UF_ID)?.name ?? 'Paraíba'

export default function StateSelector({ onEnter, className = '' }: StateSelectorProps) {
  const { open, setOpen, ref } = useDropdownState()

  function handleSelect(id: string) {
    setOpen(false)
    if (id === PB_UF_ID) onEnter()
  }

  return (
    <div
      className={`glass glass-bevel w-fit relative inline-flex items-center rounded-full px-xs py-2xs ${className}`}
    >
      <Button label="Selecione seu estado" className="h-fit py-xs" />
      <div ref={ref} className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-label={`Estado: ${pbName}`}
          onClick={() => setOpen(!open)}
          className="flex items-center gap-xl px-sm py-xs typo-body-bold rounded-full focus-visible:outline outline-2 outline-offset-2 outline-accent"
        >
          {pbName}
          <ChevronDown className="text-accent" />
        </button>

        {open && (
          <DropdownMenu options={options} value={PB_UF_ID} onSelect={handleSelect} />
        )}
      </div>
    </div>
  )
}
