import { useMemo } from 'react'
import TextInput from '@/components/ui/TextInput'
import Button from '@/components/ui/buttons/Button'
import AiActionBar from '@/components/formulator/AiActionBar'
import { Plus } from '@/components/icons'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useAiTask } from '@/hooks/useAiTask'
import { useConfirm } from '@/hooks/useConfirm'
import { useUndoable } from '@/hooks/useUndoable'
import { budgetTotal, formatBRL } from '@/utils/currency'
import { confirmReplaceBudget, filledBudgetCount } from '@/utils/formulatorOverwrite'
import type { BudgetItem } from '@/types/formulator'

export default function StepBudget() {
  const { state, setSlice } = useFormulator()
  const { municipality } = useMunicipality()
  const data = state.budget

  // Sugestão de rubricas (IA): só os nomes, derivados das atividades do plano
  // de ação — valores em R$ ficam em branco para o gestor preencher.
  const ai = useAiTask()
  const undoableItems = useUndoable<BudgetItem[]>()
  const confirm = useConfirm()

  async function suggestItems() {
    if (ai.status === 'loading' || state.actionPlan.activities.trim() === '') return
    // Troca a lista inteira E zera os valores em R$ — a perda aqui é dupla.
    const preenchidas = filledBudgetCount(data.items)
    if (preenchidas > 0 && !(await confirm(confirmReplaceBudget(preenchidas)))) return
    undoableItems.capture(data.items)
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
      undoableItems.arm()
    }
  }

  function undoItems() {
    const previous = undoableItems.undo()
    if (previous) setSlice('budget', { items: previous })
  }

  const total = useMemo(() => budgetTotal(data.items), [data.items])

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
        <AiActionBar
          label="Sugerir rubricas com IA"
          loading={ai.status === 'loading'}
          disabled={ai.status === 'loading' || state.actionPlan.activities.trim() === ''}
          onGenerate={() => void suggestItems()}
          onUndo={undoableItems.canUndo ? undoItems : undefined}
          errorMessage={ai.status === 'error' ? ai.errorMessage : null}
        >
          <Button
            label="Adicionar detalhamento"
            variant="ghost"
            size="sm"
            icon={Plus}
            iconPosition="left"
            onClick={addItem}
          />
        </AiActionBar>
      </div>

      <div className="flex flex-col gap-xs">
        <label className="typo-body-bold">Valor Total</label>
        <TextInput value={formatBRL(total)} onChange={() => {}} disabled />
      </div>
    </div>
  )
}
