// Tailwind pure — no Figma equivalent
// Barra de ação de IA das etapas do Formulador: [ações do consumidor] +
// "Gerar com IA" + "Desfazer", com a mensagem de erro logo abaixo.
//
// Existe porque o trio StepObjectives/StepIndicators/StepBudget carregava o
// mesmo bloco de ~25 linhas, já divergindo no espaçamento superior. Não cobre
// o AiField, cuja barra é alinhada à direita e inverte a ordem dos botões:
// é outro papel (aprimorar o campo em que se está digitando), não a mesma
// barra com props diferentes.

import type { ReactNode } from 'react'
import Button from '@/components/ui/buttons/Button'
import { Sparkles } from '@/components/icons'

interface AiActionBarProps {
  /** Rótulo do botão de gerar em repouso. */
  label: string
  loading: boolean
  loadingLabel?: string
  disabled?: boolean
  onGenerate: () => void
  /** Quando definido, mostra "Desfazer" à direita do botão de gerar. */
  onUndo?: () => void
  errorMessage?: string | null
  /** Botões que precedem o de IA (ex.: "Adicionar rubrica"). */
  children?: ReactNode
  className?: string
}

export default function AiActionBar({
  label,
  loading,
  loadingLabel = 'Gerando…',
  disabled = false,
  onGenerate,
  onUndo,
  errorMessage,
  children,
  className = '',
}: AiActionBarProps) {
  return (
    <>
      <div className={`mt-xs flex items-center gap-xs ${className}`}>
        {children}
        <Button
          label={loading ? loadingLabel : label}
          variant="secondary"
          size="sm"
          icon={Sparkles}
          iconPosition="left"
          disabled={disabled}
          onClick={onGenerate}
        />
        {onUndo && <Button label="Desfazer" variant="ghost" size="sm" onClick={onUndo} />}
      </div>
      {errorMessage && (
        <p className="typo-body-sm text-inactive" role="alert">
          {errorMessage}
        </p>
      )}
    </>
  )
}
