// Figma: Economics/Analysis (368:834)
// Bloco de análise de desempenho do município, gerado por IA (task
// `economic-analysis`).
//
// Fluxo: idle (CTA) → loading (chamada ao /api/ai) → typing (typewriter) → done.
// Erro volta ao CTA com a mensagem amigável do useAiTask, permitindo tentar de novo.
//
// Até a task existir, este componente exibia um texto fixo por município e o
// typewriter servia só para simular geração — inclusive com números defasados que
// contradiziam os cards logo acima. O contexto agora sai da própria API.
//
// Para resetar entre municípios, o consumidor deve passar `key={municipioId}`
// de modo que o componente monte do zero quando trocar o município.

import { useCallback, useMemo, useState } from 'react'
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
import { statusLabels } from '@/data/indicators/status-labels'
import { useAiTask } from '@/hooks/useAiTask'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useTypewriter } from '@/hooks/useTypewriter'

interface EconomicBaseAnalysisProps {
  className?: string
}

export default function EconomicBaseAnalysis({ className = '' }: EconomicBaseAnalysisProps) {
  const { municipality } = useMunicipality()
  const ai = useAiTask()
  const [analysis, setAnalysis] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  // Incrementa a cada geração — key do GeneratedState, para o typewriter
  // reiniciar mesmo quando o texto novo for parecido com o anterior.
  const [runId, setRunId] = useState(0)

  // Só os cards realmente exibidos: é a lista que o prompt autoriza o modelo a citar.
  const economicBase = useMemo(
    () =>
      (municipality.data?.economicBase ?? []).map((i) => ({
        label: i.label,
        value: i.value,
        referenceYear: i.referenceYear,
      })),
    [municipality.data],
  )

  const indicatorsSummary = useMemo(
    () =>
      (municipality.data?.agendas ?? [])
        .flatMap((a) => a.indicators)
        .map((i) => `- ${i.label}: ${i.value} (${statusLabels[i.status]})`)
        .join('\n'),
    [municipality.data],
  )

  const handleDone = useCallback(() => setIsTyping(false), [])

  async function handleGerar() {
    const result = await ai.run({
      task: 'economic-analysis',
      municipality: { id: municipality.id, name: municipality.name },
      economicBase,
      indicatorsSummary: indicatorsSummary !== '' ? indicatorsSummary : undefined,
    })
    if (!result) return
    setAnalysis(result.text)
    setRunId((n) => n + 1)
    setIsTyping(true)
  }

  const loading = ai.status === 'loading'
  // Sem cards não há contexto: o modelo preencheria o vazio inventando números.
  const disabled = loading || economicBase.length === 0

  if (analysis === '') {
    return (
      <main className={`flex flex-col glass p-md rounded-sm gap-sm w-full ${className}`}>
        <div className="flex flex-col items-end gap-sm">
          <div className="flex items-center gap-xs w-full">
            <Sparkles size={iconSizes.sm} className="text-[color:var(--semantic-accent)]" aria-hidden />
            <h4 className="typo-h4 uppercase">{emptyAnalysisTitle}</h4>
          </div>
          <p className="typo-body-sm w-full">{emptyAnalysisSubtitle}</p>
          <div className="flex items-center gap-sm w-full justify-end">
            {ai.status === 'error' && ai.errorMessage && (
              <p className="typo-body-sm text-inactive mr-auto" role="alert">
                {ai.errorMessage}
              </p>
            )}
            <Button
              label={loading ? generatingAnalysisLabel : generateAnalysisLabel}
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
    <main className={`flex flex-col glass p-md rounded-sm gap-sm w-full ${className}`}>
      <GeneratedState
        key={runId}
        analysis={analysis}
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
  isTyping,
  loading,
  errorMessage,
  disabled,
  onDone,
  onRegenerar,
}: {
  analysis: string
  isTyping: boolean
  loading: boolean
  errorMessage: string | null
  disabled: boolean
  onDone: () => void
  onRegenerar: () => void
}) {
  const { displayed } = useTypewriter({ text: analysis, enabled: isTyping, onDone })
  const shown = isTyping ? displayed : analysis
  const busy = isTyping || loading

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs">
          <Sparkles size={iconSizes.sm} className="text-[color:var(--semantic-accent)]" aria-hidden />
          <h4 className="typo-body-bold">{analysisLabel}</h4>
          {busy && (
            <span className="typo-body-sm text-inactive" aria-live="polite">
              {generatingAnalysisLabel}
            </span>
          )}
        </div>
        {!busy && (
          <Button
            label={regenerateAnalysisLabel}
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
      <p className="typo-body" aria-live={isTyping ? 'polite' : undefined}>
        {shown}
        {isTyping && <span className="typewriter-caret" aria-hidden />}
      </p>
    </>
  )
}
