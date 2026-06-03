// Figma: Economics/Analysis (368:834)
// Bloco de análise textual — simula geração por IA no protótipo.
// Fluxo: idle (CTA) → typing (efeito máquina-de-escrever) → done.
//
// Para resetar entre municípios, o consumidor deve passar `key={municipioId}`
// de modo que o componente monte do zero quando trocar o município.

import { useCallback, useState } from 'react'
import {
  analysisLabel,
  emptyAnalysisTitle,
  emptyAnalysisSubtitle,
  generateAnalysisLabel,
  regenerateAnalysisLabel,
  generatingAnalysisLabel,
} from '@/data/home/economic-base'
import { Sparkles, iconSizes } from '@/components/icons'
import Button from '@/components/ui/buttons/Button'
import { useTypewriter } from '@/hooks/useTypewriter'

interface EconomicBaseAnalysisProps {
  analysis: string
  className?: string
}

type Phase = 'idle' | 'typing' | 'done'

export default function EconomicBaseAnalysis({ analysis, className = '' }: EconomicBaseAnalysisProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  // Incrementa a cada clique em "Gerar" — usado como key do GeneratedState
  // para forçar um remount (reinicia o efeito de digitação).
  const [runId, setRunId] = useState(0)

  const handleGerar = () => {
    setPhase('typing')
    setRunId((n) => n + 1)
  }

  const handleDone = useCallback(() => setPhase('done'), [])

  return (
    <main
      className={`flex flex-col glass p-md rounded-sm gap-sm w-full ${className}`}
    >
      {phase === 'idle' ? (
        <IdleState onGerar={handleGerar} />
      ) : (
        <GeneratedState
          key={runId}
          analysis={analysis}
          isTyping={phase === 'typing'}
          onDone={handleDone}
          onRegenerar={handleGerar}
        />
      )}
    </main>
  )
}

function IdleState({ onGerar }: { onGerar: () => void }) {
  return (
    <div className="flex flex-col items-end gap-sm">
      <div className="flex items-center gap-xs w-full">
        <Sparkles
          size={iconSizes.sm}
          className="text-[color:var(--semantic-accent)]"
          aria-hidden
        />
        <h4 className="typo-h4 uppercase">{emptyAnalysisTitle}</h4>
      </div>
      <p className="typo-body w-full">{emptyAnalysisSubtitle}</p>
      <Button
        label={generateAnalysisLabel}
        variant="primary"
        size="sm"
        icon={Sparkles}
        iconPosition="left"
        onClick={onGerar}
      />
    </div>
  )
}

function GeneratedState({
  analysis,
  isTyping,
  onDone,
  onRegenerar,
}: {
  analysis: string
  isTyping: boolean
  onDone: () => void
  onRegenerar: () => void
}) {
  const { displayed } = useTypewriter({
    text: analysis,
    enabled: isTyping,
    onDone,
  })
  const shown = isTyping ? displayed : analysis

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs">
          <Sparkles
            size={iconSizes.sm}
            className="text-[color:var(--semantic-accent)]"
            aria-hidden
          />
          <h4 className="typo-body-bold">{analysisLabel}</h4>
          {isTyping && (
            <span className="typo-body-sm text-inactive" aria-live="polite">
              {generatingAnalysisLabel}
            </span>
          )}
        </div>
        {!isTyping && (
          <Button
            label={regenerateAnalysisLabel}
            variant="ghost"
            size="sm"
            icon={Sparkles}
            iconPosition="left"
            onClick={onRegenerar}
          />
        )}
      </div>
      <p className="typo-body" aria-live={isTyping ? 'polite' : undefined}>
        {shown}
        {isTyping && <span className="typewriter-caret" aria-hidden />}
      </p>
    </>
  )
}
