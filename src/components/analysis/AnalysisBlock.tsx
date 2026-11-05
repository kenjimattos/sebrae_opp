// Bloco de análise gerada por IA: CTA → loading → typewriter → texto com
// "Gerar novamente". Erro volta ao CTA com a mensagem amigável do useAiTask.
//
// Só a casca. Quem monta decide a task e o contexto (`request`) e os textos
// (`labels`): a análise do município (`AIAnalysis`) e a das emendas
// (`resources/EmendasAnalysis`) dividem este componente, e antes de ele existir a
// casca estava escrita só na primeira.
//
// `request: null` desliga o botão: sem contexto o modelo preencheria o vazio
// inventando números. Para resetar ao trocar de município (ou de esfera), o
// consumidor passa `key` — o componente monta do zero.

import { useCallback, useState } from 'react'
import { Sparkles, iconSizes } from '@/components/icons'
import Button from '@/components/ui/buttons/Button'
import AiMessage from '@/components/ui/AiMessage'
import { useAiTask } from '@/hooks/useAiTask'
import type { AiTaskRequest } from '@/types/ai'

export interface AnalysisBlockLabels {
  /** Título do bloco antes de gerar. */
  emptyTitle: string
  emptySubtitle: string
  /** Título do bloco depois de gerado. */
  title: string
  generate: string
  regenerate: string
  generating: string
}

interface AnalysisBlockProps {
  request: AiTaskRequest | null
  labels: AnalysisBlockLabels
  className?: string
}

export default function AnalysisBlock({ request, labels, className = '' }: AnalysisBlockProps) {
  const ai = useAiTask()
  const [analysis, setAnalysis] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  // Incrementa a cada geração — key do GeneratedState, para o typewriter
  // reiniciar mesmo quando o texto novo for parecido com o anterior.
  const [runId, setRunId] = useState(0)

  const handleDone = useCallback(() => setIsTyping(false), [])

  async function handleGerar() {
    if (!request) return
    const result = await ai.run(request)
    if (!result) return
    setAnalysis(result.text)
    setRunId((n) => n + 1)
    setIsTyping(true)
  }

  const loading = ai.status === 'loading'
  const disabled = loading || request === null

  if (analysis === '') {
    return (
      <main className={`flex flex-col glass p-md rounded gap-sm w-full ${className}`}>
        <div className="flex flex-col items-end gap-sm">
          <div className="flex items-center gap-xs w-full">
            <Sparkles size={iconSizes.sm} className="text-accent" aria-hidden />
            <h4 className="typo-h4 uppercase">{labels.emptyTitle}</h4>
          </div>
          <p className="typo-body-sm w-full">{labels.emptySubtitle}</p>
          <div className="flex items-center gap-sm w-full justify-end">
            {ai.status === 'error' && ai.errorMessage && (
              <p className="typo-body-sm text-inactive mr-auto" role="alert">
                {ai.errorMessage}
              </p>
            )}
            <Button
              label={loading ? labels.generating : labels.generate}
              variant="primary"
              size="sm"
              icon={Sparkles}
              iconPosition="left"
              disabled={disabled}
              onClick={handleGerar}
            />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={`flex flex-col glass p-md rounded gap-sm w-full ${className}`}>
      <GeneratedState
        key={runId}
        analysis={analysis}
        labels={labels}
        isTyping={isTyping}
        loading={loading}
        errorMessage={ai.status === 'error' ? ai.errorMessage : null}
        disabled={disabled}
        onDone={handleDone}
        onRegenerar={handleGerar}
      />
    </main>
  )
}

function GeneratedState({
  analysis,
  labels,
  isTyping,
  loading,
  errorMessage,
  disabled,
  onDone,
  onRegenerar,
}: {
  analysis: string
  labels: AnalysisBlockLabels
  isTyping: boolean
  loading: boolean
  errorMessage: string | null
  disabled: boolean
  onDone: () => void
  onRegenerar: () => void
}) {
  const busy = isTyping || loading

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs">
          <Sparkles size={iconSizes.sm} className="text-accent" aria-hidden />
          <h4 className="typo-body-bold">{labels.title}</h4>
          {busy && (
            <span className="typo-body-sm text-inactive" aria-live="polite">
              {labels.generating}
            </span>
          )}
        </div>
        {!busy && (
          <Button
            label={labels.regenerate}
            variant="ghost"
            size="sm"
            icon={Sparkles}
            iconPosition="left"
            disabled={disabled}
            onClick={onRegenerar}
          />
        )}
      </div>
      {errorMessage && (
        <p className="typo-body-sm text-inactive" role="alert">
          {errorMessage}
        </p>
      )}
      <AiMessage text={analysis} isTyping={isTyping} onDone={onDone} icon={false} />
    </>
  )
}
