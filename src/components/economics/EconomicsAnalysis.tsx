// Figma: Economics/Analysis (368:834)
// Bloco de análise textual — simula geração por IA no protótipo.
// Fluxo: idle (CTA) → typing (efeito máquina-de-escrever) → done.
//
// Para resetar entre municípios, o consumidor deve passar `key={municipioId}`
// de modo que o componente monte do zero quando trocar o município.

import { useCallback, useState } from 'react'
import {
  analiseLabel,
  emptyAnaliseTitle,
  emptyAnaliseSubtitle,
  gerarAnaliseLabel,
  regenerarAnaliseLabel,
  gerandoAnaliseLabel,
} from '@/data/economics'
import { Sparkles, iconSizes } from '@/components/icons'
import Button from '@/components/ui/buttons/Button'
import Card from '@/components/ui/Card'
import { useTypewriter } from '@/hooks/useTypewriter'

interface EconomicsAnalysisProps {
  analise: string
  className?: string
}

type Phase = 'idle' | 'typing' | 'done'

export default function EconomicsAnalysis({ analise, className = '' }: EconomicsAnalysisProps) {
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
    <Card
      as="section"
      padding="lg"
      className={`flex flex-col gap-sm w-full card-hoverable ${className}`}
    >
      {phase === 'idle' ? (
        <IdleState onGerar={handleGerar} />
      ) : (
        <GeneratedState
          key={runId}
          analise={analise}
          isTyping={phase === 'typing'}
          onDone={handleDone}
          onRegenerar={handleGerar}
        />
      )}
    </Card>
  )
}

function IdleState({ onGerar }: { onGerar: () => void }) {
  return (
    <div className="flex flex-col items-start gap-sm">
      <div className="flex items-center gap-xs">
        <Sparkles
          size={iconSizes.sm}
          className="text-[color:var(--semantic-accent)]"
          aria-hidden
        />
        <h4 className="typo-body-bold">{emptyAnaliseTitle}</h4>
      </div>
      <p className="typo-body text-inactive">{emptyAnaliseSubtitle}</p>
      <Button
        label={gerarAnaliseLabel}
        variant="primary"
        size="md"
        icon={Sparkles}
        iconPosition="left"
        onClick={onGerar}
      />
    </div>
  )
}

function GeneratedState({
  analise,
  isTyping,
  onDone,
  onRegenerar,
}: {
  analise: string
  isTyping: boolean
  onDone: () => void
  onRegenerar: () => void
}) {
  const { displayed } = useTypewriter({
    text: analise,
    enabled: isTyping,
    onDone,
  })
  const shown = isTyping ? displayed : analise

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs">
          <Sparkles
            size={iconSizes.sm}
            className="text-[color:var(--semantic-accent)]"
            aria-hidden
          />
          <h4 className="typo-body-bold">{analiseLabel}</h4>
          {isTyping && (
            <span className="typo-body-sm text-inactive" aria-live="polite">
              {gerandoAnaliseLabel}
            </span>
          )}
        </div>
        {!isTyping && (
          <Button
            label={regenerarAnaliseLabel}
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
