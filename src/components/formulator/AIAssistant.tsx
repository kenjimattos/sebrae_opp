// Figma: Formulador/AIAssistant (603:1803)
// Sidebar direita: bloco "Assistente IA" + descrição + bloco "Exemplo" com separador + bloco "Ações da IA".
// Conteúdo varia por etapa (src/data/formulator/ai-assistant.ts); as ações
// disparam gerações reais via useFormulatorAi (etapas sem ação: actions []).

import Card from '@/components/ui/Card'
import Button from '@/components/ui/buttons/Button'
import { Sparkles } from '@/components/icons'

export interface AIAssistantAction {
  id: string
  label: string
}

export interface AIAssistantContent {
  description: string
  examples: string[]
  actions: AIAssistantAction[]
}

interface AIAssistantProps {
  content: AIAssistantContent
  onAction?: (actionId: string) => void
  /** Ação em andamento — desabilita os botões e troca o label da ativa. */
  busyActionId?: string | null
  errorMessage?: string | null
  className?: string
}

export default function AIAssistant({
  content,
  onAction,
  busyActionId = null,
  errorMessage = null,
  className = '',
}: AIAssistantProps) {
  return (
    <Card
      surface="secondary"
      padding="md"
      radius="md"
      className={`flex flex-col items-start gap-md w-[248px] ${className}`}
    >
      <div className="flex flex-col items-start gap-md w-full">
        <p className="typo-body-bold">Assistente IA</p>
        <p className="typo-body-sm">{content.description}</p>
      </div>

      <div className="flex flex-col items-start gap-md w-full">
        <p className="typo-body-bold">Exemplo</p>
        <div className="flex flex-col items-start gap-sm w-full">
          {content.examples.map((example, i) => (
            <div key={i} className="w-full flex flex-col gap-sm">
              <p className="typo-body-sm">{example}</p>
              {i < content.examples.length - 1 && <div className="divider" />}
            </div>
          ))}
        </div>
      </div>

      {content.actions.length > 0 && (
        <div className="flex flex-col items-start gap-md w-full">
          <p className="typo-body-bold">Ações da IA</p>
          <div className="flex flex-col items-center gap-xs w-full">
            {content.actions.map((action) => (
              <Button
                key={action.id}
                label={busyActionId === action.id ? 'Gerando…' : action.label}
                variant="secondary"
                size="md"
                icon={Sparkles}
                iconPosition="left"
                disabled={busyActionId !== null}
                onClick={() => onAction?.(action.id)}
                className="w-[200px]"
              />
            ))}
          </div>
          {errorMessage && <p className="typo-body-sm text-inactive">{errorMessage}</p>}
        </div>
      )}
    </Card>
  )
}
