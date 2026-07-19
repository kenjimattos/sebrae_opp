// Wrapper de TextInput com ação "Aprimorar com IA": envia o texto atual ao
// LLM (task improve-field) e digita o resultado de volta no campo com
// typewriter, com "Desfazer" para restaurar o texto anterior. Wrapper — e não
// prop no TextInput — para manter o primitivo compartilhado intocado.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AiTaskRequest } from '@/types/ai'
import { useAiTask } from '@/hooks/useAiTask'
import { useTypewriter } from '@/hooks/useTypewriter'
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
  const [showUndo, setShowUndo] = useState(false)
  const previousValue = useRef('')

  // onChange do pai troca de identidade a cada render (closures sobre o
  // slice) — encaminhar via ref evita re-disparo do efeito de digitação.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  const handleDone = useCallback(() => {
    setTyping(false)
    setShowUndo(true)
  }, [])

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

  const busy = ai.status === 'loading' || typing

  async function improve() {
    if (busy || value.trim() === '') return
    previousValue.current = value
    setShowUndo(false)
    const result = await ai.run(buildRequest(value))
    if (result) {
      setGenerated(result.text)
      setTyping(true)
    }
  }

  function undo() {
    onChange(previousValue.current)
    setShowUndo(false)
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
          setShowUndo(false)
          onChange(v)
        }}
      />
      <div className="flex items-center justify-end gap-xs w-full">
        {ai.status === 'error' && ai.errorMessage && (
          <p className="typo-body-sm text-inactive mr-auto">{ai.errorMessage}</p>
        )}
        {showUndo && (
          <Button label="Desfazer" variant="ghost" size="sm" onClick={undo} />
        )}
        <Button
          label={ai.status === 'loading' ? 'Aprimorando…' : buttonLabel}
          variant="ghost"
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
