import { useMemo } from 'react'
import TextInput from '@/components/ui/TextInput'
import Button from '@/components/ui/buttons/Button'
import { Plus } from '@/components/icons'
import { useFormulator } from '@/hooks/useFormulator'

function parseValue(valor: string): number {
  // Aceita "1.000,50", "1000.50", "1000,50", "R$ 1.000,50" etc.
  const cleaned = valor
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const num = parseFloat(cleaned)
  return Number.isFinite(num) ? num : 0
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export default function StepBudget() {
  const { state, setSlice } = useFormulator()
  const data = state.budget

  const total = useMemo(
    () => data.items.reduce((acc: number, r: { label: string; value: string }) => acc + parseValue(r.value), 0),
    [data.items],
  )

  const setItem = (idx: number, patch: Partial<{ label: string; value: string }>) => {
    const items = data.items.map((r: { label: string; value: string }, i: number) => (i === idx ? { ...r, ...patch } : r))
    setSlice('budget', { items })
  }

  const addItem = () =>
    setSlice('budget', { items: [...data.items, { label: '', value: '' }] })

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-col gap-xs">
        <p className="typo-body-bold">Detalhamento por Rubrica</p>
        <div className="flex flex-col gap-sm">
          {data.items.map((item: { label: string; value: string }, idx: number) => (
            <div key={idx} className="grid grid-cols-2 gap-sm">
              <div className="flex flex-col gap-2xs">
                <span className="typo-body-sm">Rúbrica {idx + 1}</span>
                <TextInput
                  value={item.label}
                  hint="Pessoal, material, serviços..."
                  onChange={(v) => setItem(idx, { label: v })}
                />
              </div>
              <div className="flex flex-col gap-2xs">
                <span className="typo-body-sm">Valor {idx + 1} (R$)</span>
                <TextInput
                  value={item.value}
                  hint="Ex.: 1000,00"
                  onChange={(v) => setItem(idx, { value: v })}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-xs">
          <Button
            label="Adicionar detalhamento"
            variant="ghost"
            size="sm"
            icon={Plus}
            iconPosition="left"
            onClick={addItem}
          />
        </div>
      </div>

      <div className="flex flex-col gap-xs">
        <label className="typo-body-bold">Valor Total</label>
        <TextInput value={formatBRL(total)} onChange={() => {}} disabled />
      </div>
    </div>
  )
}
