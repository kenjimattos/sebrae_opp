import { useMemo } from 'react'
import TextInput from '@/components/ui/TextInput'
import Button from '@/components/ui/buttons/Button'
import { Plus } from '@/components/icons'
import { useFormulador } from '@/hooks/useFormulador'

function parseValor(valor: string): number {
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

export default function StepOrcamento() {
  const { state, setSlice } = useFormulador()
  const data = state.orcamento

  const total = useMemo(
    () => data.rubricas.reduce((acc, r) => acc + parseValor(r.valor), 0),
    [data.rubricas],
  )

  const setRubrica = (idx: number, patch: Partial<{ label: string; valor: string }>) => {
    const rubricas = data.rubricas.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    setSlice('orcamento', { rubricas })
  }

  const addRubrica = () =>
    setSlice('orcamento', { rubricas: [...data.rubricas, { label: '', valor: '' }] })

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-col gap-xs">
        <p className="typo-body-bold">Detalhamento por Rubrica</p>
        <div className="flex flex-col gap-sm">
          {data.rubricas.map((rubrica, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-sm">
              <div className="flex flex-col gap-2xs">
                <span className="typo-body-sm">Rúbrica {idx + 1}</span>
                <TextInput
                  value={rubrica.label}
                  hint="Pessoal, material, serviços..."
                  onChange={(v) => setRubrica(idx, { label: v })}
                />
              </div>
              <div className="flex flex-col gap-2xs">
                <span className="typo-body-sm">Valor {idx + 1} (R$)</span>
                <TextInput
                  value={rubrica.valor}
                  hint="Ex.: 1000,00"
                  onChange={(v) => setRubrica(idx, { valor: v })}
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
            onClick={addRubrica}
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
