import { useMemo, useRef, useState } from 'react'
import TextInput from '@/components/ui/TextInput'
import Button from '@/components/ui/buttons/Button'
import { Plus, Sparkles } from '@/components/icons'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useAiTask } from '@/hooks/useAiTask'

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
  const { municipality } = useMunicipality()
  const data = state.budget

  // Sugestão de rubricas (IA): só os nomes, derivados das atividades do plano
  // de ação — valores em R$ ficam em branco para o gestor preencher.
  const ai = useAiTask()
  const previousItems = useRef<{ label: string; value: string }[] | null>(null)
  const [showUndo, setShowUndo] = useState(false)

  async function suggestItems() {
    if (ai.status === 'loading' || state.actionPlan.activities.trim() === '') return
    previousItems.current = data.items
    setShowUndo(false)
    const result = await ai.run({
      task: 'suggest-budget-items',
      activities: state.actionPlan.activities,
      municipality: { id: municipality.id, name: municipality.name },
      context: {
        objetivoGeral: state.objectives.general,
        duracao: state.identification.duration,
      },
    })
    if (result?.items && result.items.length > 0) {
      setSlice('budget', { items: result.items.map((label) => ({ label, value: '' })) })
      setShowUndo(true)
    }
  }

  function undoItems() {
    if (previousItems.current) setSlice('budget', { items: previousItems.current })
    setShowUndo(false)
  }

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
        <div className="mt-xs flex items-center gap-xs">
          <Button
            label="Adicionar detalhamento"
            variant="ghost"
            size="sm"
            icon={Plus}
            iconPosition="left"
            onClick={addItem}
          />
          <Button
            label={ai.status === 'loading' ? 'Gerando…' : 'Sugerir rubricas com IA'}
            variant="secondary"
            size="sm"
            icon={Sparkles}
            iconPosition="left"
            disabled={ai.status === 'loading' || state.actionPlan.activities.trim() === ''}
            onClick={() => void suggestItems()}
          />
          {showUndo && (
            <Button label="Desfazer" variant="ghost" size="sm" onClick={undoItems} />
          )}
        </div>
        {ai.status === 'error' && ai.errorMessage && (
          <p className="typo-body-sm text-inactive">{ai.errorMessage}</p>
        )}
      </div>

      <div className="flex flex-col gap-xs">
        <label className="typo-body-bold">Valor Total</label>
        <TextInput value={formatBRL(total)} onChange={() => {}} disabled />
      </div>
    </div>
  )
}
