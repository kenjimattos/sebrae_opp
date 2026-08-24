// Modal "IA" do indicador: explicação pré-gravada digitada por typewriter,
// perguntas sugeridas com respostas prontas (mesmo efeito) e pergunta livre —
// esta sim faz chamada real ao LLM via /api/ai. Thread cresce para baixo;
// só a última entrada digita (padrão EconomicsAnalysis: remount por key).

import { useEffect, useRef, useState } from 'react'
import type { Indicator } from '@/types/indicators'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useAiTask } from '@/hooks/useAiTask'
import Modal from '@/components/ui/Modal'
import TextInput from '@/components/ui/TextInput'
import Button from '@/components/ui/buttons/Button'
import AiMessage from '@/components/ui/AiMessage'
import { Sparkles } from '@/components/icons'
import { statusLabels } from '@/data/indicators/status-labels'
import { indicatorInfo } from '@/data/indicators/descriptions/indicators'
import {
  fillTemplate,
  indicatorAiContent,
} from '@/data/indicators/descriptions/indicator-ai'
import { catalog } from '@/data/indicators/catalog'
import { statusStyles } from '@/utils/statusStyles'

interface IndicatorModalProps {
  indicator: Indicator
  open: boolean
  onClose: () => void
}

interface ThreadEntry {
  id: number
  question?: string
  answer: string
  source: 'prerecorded' | 'llm' | 'error'
}

const FALLBACK_EXPLANATION =
  'Este indicador compõe o diagnóstico do município na Jornada do Município Empreendedor. ' +
  'Use a pergunta livre abaixo para saber mais sobre ele.'

// Delay do flash "Gerando resposta…" das respostas pré-gravadas — iguala a
// percepção das respostas prontas à das geradas de verdade.
const PRERECORDED_DELAY_MS = 400

function catalogUnit(id: string | undefined): string | undefined {
  if (!id) return undefined
  for (const agenda of catalog.agendas) {
    const found = agenda.indicators.find((ind) => ind.id === id)
    if (found) return found.unit
  }
  return undefined
}

export default function IndicatorModal({ indicator, open, onClose }: IndicatorModalProps) {
  const { municipality } = useMunicipality()
  const ai = useAiTask()

  const contentKey = indicator.id ?? indicator.label
  const content = indicatorAiContent[contentKey]
  const vars = {
    municipio: municipality.name,
    valor: String(indicator.value),
    status: statusLabels[indicator.status],
  }
  const explanation = fillTemplate(
    content?.explanation ?? indicatorInfo[contentKey] ?? FALLBACK_EXPLANATION,
    vars,
  )

  const [entries, setEntries] = useState<ThreadEntry[]>([
    { id: 0, answer: explanation, source: 'prerecorded' },
  ])
  // Entrada em digitação (typewriter ativo). Começa na explicação.
  const [typingId, setTypingId] = useState<number | null>(0)
  // Pergunta aguardando resposta (flash "Gerando resposta…").
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [usedQuestions, setUsedQuestions] = useState<number[]>([])
  const [freeQuestion, setFreeQuestion] = useState('')
  const nextId = useRef(1)
  const timerRef = useRef<number | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  const busy = typingId !== null || pendingQuestion !== null

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  // Auto-scroll do thread a cada entrada nova / estado de loading.
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries.length, pendingQuestion, typingId])

  function appendEntry(entry: Omit<ThreadEntry, 'id'>) {
    const id = nextId.current++
    setEntries((prev) => [...prev, { ...entry, id }])
    setPendingQuestion(null)
    // Mensagens de erro aparecem inteiras, sem typewriter.
    setTypingId(entry.source === 'error' ? null : id)
  }

  function askSuggested(index: number) {
    const qa = content?.questions[index]
    if (!qa || busy) return
    setUsedQuestions((prev) => [...prev, index])
    setPendingQuestion(fillTemplate(qa.question, vars))
    timerRef.current = window.setTimeout(() => {
      appendEntry({
        question: fillTemplate(qa.question, vars),
        answer: fillTemplate(qa.answer, vars),
        source: 'prerecorded',
      })
    }, PRERECORDED_DELAY_MS)
  }

  async function askFree() {
    const question = freeQuestion.trim()
    if (question === '' || busy) return
    setFreeQuestion('')
    setPendingQuestion(question)
    const result = await ai.run({
      task: 'indicator-question',
      question,
      indicator: {
        id: contentKey,
        label: indicator.label,
        value: indicator.value,
        status: indicator.status,
        unit: catalogUnit(indicator.id),
      },
      municipality: { id: municipality.id, name: municipality.name },
    })
    if (result) {
      appendEntry({ question, answer: result.text, source: 'llm' })
    } else {
      appendEntry({
        question,
        answer: ai.errorMessage ?? 'Não foi possível gerar a resposta agora.',
        source: 'error',
      })
    }
  }

  const availableQuestions =
    content?.questions
      .map((qa, index) => ({ qa, index }))
      .filter(({ index }) => !usedQuestions.includes(index)) ?? []

  return (
    <Modal open={open} onClose={onClose} title={indicator.label} >
      {/* Valor + status atuais */}
      <div className="flex items-center gap-xs mb-md">
        <span className={statusStyles[indicator.status].dot} aria-hidden />
        <span className="typo-body-sm text-inactive">
          {String(indicator.value)} · {statusLabels[indicator.status]} · {municipality.name}
        </span>
      </div>

      {/* Thread */}
      <div ref={threadRef} className="flex flex-col gap-md max-h-[380px] overflow-y-auto pr-xs">
        {entries.map((entry) => (
          <ThreadBlock
            key={entry.id}
            entry={entry}
            isTyping={typingId === entry.id}
            onDone={() => setTypingId((current) => (current === entry.id ? null : current))}
          />
        ))}
        {pendingQuestion !== null && (
          <div className="flex flex-col gap-xs">
            <p className="typo-body-bold">{pendingQuestion}</p>
            <p className="typo-body-sm text-inactive" aria-live="polite">
              Gerando resposta…
            </p>
          </div>
        )}
      </div>

      {/* Perguntas sugeridas */}
      {availableQuestions.length > 0 && (
        <div className="flex flex-wrap gap-xs mt-md">
          {availableQuestions.map(({ qa, index }) => (
            <Button
              key={index}
              label={fillTemplate(qa.question, vars)}
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => askSuggested(index)}
            />
          ))}
        </div>
      )}

      {/* Pergunta livre → LLM */}
      <form
        className="flex items-center gap-xs mt-md"
        onSubmit={(e) => {
          e.preventDefault()
          void askFree()
        }}
      >
        <TextInput
          value={freeQuestion}
          onChange={setFreeQuestion}
          hint="Faça sua própria pergunta sobre este indicador…"
          disabled={busy}
        />
        <Button
          label="Perguntar"
          variant="primary"
          size="md"
          icon={Sparkles}
          iconPosition="left"
          disabled={busy || freeQuestion.trim() === ''}
          onClick={() => void askFree()}
        />
      </form>
    </Modal>
  )
}

function ThreadBlock({
  entry,
  isTyping,
  onDone,
}: {
  entry: ThreadEntry
  isTyping: boolean
  onDone: () => void
}) {
  return (
    <div className="flex flex-col gap-xs">
      {entry.question !== undefined && <p className="typo-body-bold">{entry.question}</p>}
      <AiMessage
        text={entry.answer}
        isTyping={isTyping}
        onDone={onDone}
        isError={entry.source === 'error'}
      />
    </div>
  )
}
