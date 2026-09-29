// Estado de uma chamada de IA (loading/erro/resultado) + mensagens de erro
// amigáveis centralizadas. Cada superfície de IA (modal, AiField, chat)
// instancia o seu.
import { useCallback, useRef, useState } from 'react'
import { AiRequestError, postAiTask } from '@/data/ai'
import type { AiSuccessResponse, AiTaskRequest } from '@/types/ai'

export type AiStatus = 'idle' | 'loading' | 'done' | 'error'

const FRIENDLY_MESSAGES: Record<string, string> = {
  // Sem "gratuito" nem "de hoje": dizer que a cota é gratuita e diária ensina
  // a esgotá-la.
  rate_limited: 'Muitas consultas no momento. Tente novamente em alguns minutos.',
  unavailable: 'O assistente está indisponível no momento.',
}
const FALLBACK_MESSAGE = 'Não foi possível gerar a resposta agora. Tente novamente em instantes.'

export interface UseAiTaskResult {
  status: AiStatus
  text: string
  items: string[] | null
  errorMessage: string | null
  run: (req: AiTaskRequest) => Promise<AiSuccessResponse | null>
  reset: () => void
}

export function useAiTask(): UseAiTaskResult {
  const [status, setStatus] = useState<AiStatus>('idle')
  const [text, setText] = useState('')
  const [items, setItems] = useState<string[] | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Ignora respostas de chamadas antigas se run() for disparado de novo.
  const runId = useRef(0)

  const run = useCallback(async (req: AiTaskRequest): Promise<AiSuccessResponse | null> => {
    const id = ++runId.current
    setStatus('loading')
    setErrorMessage(null)
    try {
      const result = await postAiTask(req)
      if (id !== runId.current) return null
      setText(result.text)
      setItems(result.items ?? null)
      setStatus('done')
      return result
    } catch (err) {
      if (id !== runId.current) return null
      const code = err instanceof AiRequestError ? err.code : 'upstream_error'
      setErrorMessage(FRIENDLY_MESSAGES[code] ?? FALLBACK_MESSAGE)
      setStatus('error')
      return null
    }
  }, [])

  const reset = useCallback(() => {
    runId.current++
    setStatus('idle')
    setText('')
    setItems(null)
    setErrorMessage(null)
  }, [])

  return { status, text, items, errorMessage, run, reset }
}
