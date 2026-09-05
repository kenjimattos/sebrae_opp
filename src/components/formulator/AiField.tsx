// Wrapper de TextInput com ação "Aprimorar com IA": envia o texto atual ao
// LLM (task improve-field) e digita o resultado de volta no campo com
// typewriter, com "Desfazer" para restaurar o texto anterior. Wrapper — e não
// prop no TextInput — para manter o primitivo compartilhado intocado.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AiTaskRequest } from '@/types/ai'
import { useAiTask } from '@/hooks/useAiTask'
import { useConfirm } from '@/hooks/useConfirm'
import { confirmReplaceField } from '@/utils/formulatorOverwrite'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useUndoable } from '@/hooks/useUndoable'
import TextInput from '@/components/ui/TextInput'
import Button from '@/components/ui/buttons/Button'
import { Sparkles } from '@/components/icons'

interface AiFieldProps {
  value: string
  onChange: (value: string) => void
  /** Monta a AiTaskRequest a partir do texto atual do campo. */
  buildRequest: (currentText: string) => AiTaskRequest
  title?: string
  subtitle?: string
  hint?: string
  multiline?: boolean
  rows?: number
  buttonLabel?: string
  className?: string
}

export default function AiField({
  value,
  onChange,
  buildRequest,
  title,
  subtitle,
  hint,
  multiline = false,
  rows,
  buttonLabel = 'Aprimorar com IA',
  className = '',
}: AiFieldProps) {
  const ai = useAiTask()
  const [generated, setGenerated] = useState('')
  const [typing, setTyping] = useState(false)
  const undoable = useUndoable<string>()

  // onChange do pai troca de identidade a cada render (closures sobre o
  // slice) — encaminhar via ref evita re-disparo do efeito de digitação.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  // Depende de `arm` (estável por useCallback), não do objeto do hook: o
  // onDone entra nas deps do useTypewriter, e identidade nova a cada render
  // reiniciaria a digitação.
  const arm = undoable.arm
  const handleDone = useCallback(() => {
    setTyping(false)
    arm()
  }, [arm])

  const { displayed } = useTypewriter({
    text: generated,
    enabled: typing,
    speed: 12,
    onDone: handleDone,
  })

  // Digita o texto gerado dentro do próprio campo (grava no estado do
  // formulador a cada tick — aceitável; o campo fica disabled enquanto isso).
  useEffect(() => {
    if (typing) onChangeRef.current(displayed)
  }, [displayed, typing])

  const confirm = useConfirm()
  const busy = ai.status === 'loading' || typing

  async function improve() {
    if (busy || value.trim() === '') return
    // O botão só habilita com o campo preenchido, então aprimorar é sempre
    // trocar um texto do gestor por outro. Confirmar antes, não depois.
    if (!(await confirm(confirmReplaceField(title)))) return
    undoable.capture(value)
    const result = await ai.run(buildRequest(value))
    if (result) {
      setGenerated(result.text)
      setTyping(true)
    }
  }

  function undo() {
    onChange(undoable.undo() ?? '')
  }

  return (
    <div className={`flex flex-col gap-xs w-full ${className}`}>
      <TextInput
        title={title}
        subtitle={subtitle}
        hint={hint}
        multiline={multiline}
        rows={rows}
        value={value}
        disabled={busy}
        onChange={(v) => {
          undoable.reset()
          onChange(v)
        }}
      />
      <div className="flex items-center justify-end gap-xs w-full">
        {ai.status === 'error' && ai.errorMessage && (
          <p className="typo-body-sm text-inactive mr-auto" role="alert">
            {ai.errorMessage}
          </p>
        )}
        {undoable.canUndo && (
          <Button label="Desfazer" variant="ghost" size="sm" onClick={undo} />
        )}
        <Button
          label={ai.status === 'loading' ? 'Aprimorando…' : buttonLabel}
          size="sm"
          icon={Sparkles}
          iconPosition="left"
          disabled={busy || value.trim() === ''}
          onClick={() => void improve()}
        />
      </div>
    </div>
  )
}
