// Painel do chat global: thread multi-turno com o LLM (task 'chat'), sugestões
// de pergunta com o thread vazio e contexto real do município (resumo compacto
// dos indicadores vai no system prompt — a function na Vercel não lê o banco).
// Respostas digitam com typewriter; estado vive no componente (some ao fechar).

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AiChatMessage } from '@/types/ai'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useAiTask } from '@/hooks/useAiTask'
import { useTypewriter } from '@/hooks/useTypewriter'
import TextInput from '@/components/ui/TextInput'
import Button from '@/components/ui/buttons/Button'
import IconButton from '@/components/ui/buttons/IconButton'
import MarkdownLite from '@/components/ui/MarkdownLite'
import { Sparkles, X, iconSizes } from '@/components/icons'
import { statusLabels } from '@/data/indicators/status-labels'
import {
  chatEmptyMessage,
  chatInputHint,
  chatSuggestions,
  chatTitle,
} from '@/data/chat/suggestions'

interface ChatPanelProps {
  onClose: () => void
}

interface ChatEntry {
  id: number
  role: 'user' | 'assistant'
  content: string
  isError?: boolean
}

// Histórico máximo enviado por chamada (o handler ainda capa em 12).
const HISTORY_LIMIT = 10

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const { municipality } = useMunicipality()
  const ai = useAiTask()
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [typingId, setTypingId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const nextId = useRef(0)
  const threadRef = useRef<HTMLDivElement>(null)

  const busy = ai.status === 'loading' || typingId !== null

  // Resumo compacto dos indicadores — contexto real pro modelo.
  const indicatorsSummary = useMemo(() => {
    const agendas = municipality.data?.agendas ?? []
    return agendas
      .flatMap((a) => a.indicators)
      .map((i) => `${i.label}: ${i.value} (${statusLabels[i.status]})`)
      .join('; ')
  }, [municipality.data])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries.length, ai.status, typingId])

  async function send(text: string) {
    const question = text.trim()
    if (question === '' || busy) return
    setDraft('')

    const userEntry: ChatEntry = { id: nextId.current++, role: 'user', content: question }
    setEntries((prev) => [...prev, userEntry])

    // Histórico limpo (sem entradas de erro) + a mensagem nova.
    const history: AiChatMessage[] = [...entries, userEntry]
      .filter((e) => !e.isError)
      .map((e) => ({ role: e.role, content: e.content }))
      .slice(-HISTORY_LIMIT)

    const result = await ai.run({
      task: 'chat',
      messages: history,
      municipality: { id: municipality.id, name: municipality.name },
      indicatorsSummary: indicatorsSummary !== '' ? indicatorsSummary : undefined,
    })

    const id = nextId.current++
    if (result) {
      setEntries((prev) => [...prev, { id, role: 'assistant', content: result.text }])
      setTypingId(id)
    } else {
      setEntries((prev) => [
        ...prev,
        {
          id,
          role: 'assistant',
          content: ai.errorMessage ?? 'Não foi possível gerar a resposta agora.',
          isError: true,
        },
      ])
    }
  }

  const suggestions = chatSuggestions.map((s) =>
    s.replaceAll('{municipio}', municipality.name),
  )

  return createPortal(
    <aside
      aria-label={chatTitle}
      className="fixed right-0 top-0 h-full w-[400px] z-50 flex flex-col bg-[var(--semantic-surface-primary)] border-l border-[var(--semantic-surface-secondary)] shadow-lg"
    >
      {/* Header */}
      <div className="flex-between gap-md p-md border-b border-[var(--semantic-surface-secondary)]">
        <div className="flex items-center gap-xs">
          <Sparkles size={iconSizes.md} className="text-[color:var(--semantic-accent)]" aria-hidden />
          <div className="flex flex-col">
            <p className="typo-body-bold">{chatTitle}</p>
            <p className="typo-body-sm text-inactive">{municipality.name}</p>
          </div>
        </div>
        <IconButton icon={X} variant="ghost" size="sm" aria-label="Fechar chat" onClick={onClose} />
      </div>

      {/* Thread */}
      <div ref={threadRef} className="flex-1 min-h-0 overflow-y-auto p-md flex flex-col gap-md">
        {entries.length === 0 && (
          <div className="flex flex-col gap-sm">
            <p className="typo-body-sm text-inactive">{chatEmptyMessage}</p>
            <div className="flex flex-col items-start gap-xs">
              {suggestions.map((s) => (
                <Button
                  key={s}
                  label={s}
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => void send(s)}
                />
              ))}
            </div>
          </div>
        )}

        {entries.map((entry) => (
          <ChatBubble
            key={entry.id}
            entry={entry}
            isTyping={typingId === entry.id}
            onDone={() => setTypingId((current) => (current === entry.id ? null : current))}
          />
        ))}

        {ai.status === 'loading' && (
          <p className="typo-body-sm text-inactive" aria-live="polite">
            Gerando resposta…
          </p>
        )}
      </div>

      {/* Input */}
      <form
        className="flex items-center gap-xs p-md border-t border-[var(--semantic-surface-secondary)]"
        onSubmit={(e) => {
          e.preventDefault()
          void send(draft)
        }}
      >
        <TextInput value={draft} onChange={setDraft} hint={chatInputHint} disabled={busy} />
        <Button
          label="Enviar"
          variant="primary"
          size="md"
          disabled={busy || draft.trim() === ''}
          onClick={() => void send(draft)}
        />
      </form>
    </aside>,
    document.body,
  )
}

function ChatBubble({
  entry,
  isTyping,
  onDone,
}: {
  entry: ChatEntry
  isTyping: boolean
  onDone: () => void
}) {
  const { displayed } = useTypewriter({ text: entry.content, enabled: isTyping, onDone })
  const shown = isTyping ? displayed : entry.content

  if (entry.role === 'user') {
    return (
      <div className="self-end max-w-[85%] card-surface-secondary px-sm py-xs">
        <p className="typo-body">{entry.content}</p>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-xs max-w-[95%]">
      <Sparkles
        size={iconSizes.sm}
        className="text-[color:var(--semantic-accent)] shrink-0 mt-[2px]"
        aria-hidden
      />
      <div
        className={`typo-body ${entry.isError ? 'text-inactive' : ''}`}
        aria-live={isTyping ? 'polite' : undefined}
      >
        <MarkdownLite text={shown} />
        {isTyping && <span className="typewriter-caret" aria-hidden />}
      </div>
    </div>
  )
}
