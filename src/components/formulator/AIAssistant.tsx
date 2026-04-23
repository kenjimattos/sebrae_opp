// Figma: Formulador/AIAssistant (603:1803)
// Sidebar direita: bloco "Assistente IA" + descrição + bloco "Exemplo" com separador + bloco "Ações da IA".
// Conteúdo varia por etapa (formulador-ai.ts). Os botões são no-op por enquanto (TODO: integração LLM).

import Card from '@/components/ui/Card'
import Button from '@/components/ui/buttons/Button'

export interface AIAssistantContent {
  description: string
  examples: string[]
  actions: string[]
}

interface AIAssistantProps {
  content: AIAssistantContent
  onAction?: (action: string) => void
  className?: string
}

export default function AIAssistant({
  content,
  onAction,
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

      <div className="flex flex-col items-start gap-md w-full">
        <p className="typo-body-bold">Ações da IA</p>
        <div className="flex flex-col items-center gap-xs w-full">
          {content.actions.map((action) => (
            <Button
              key={action}
              label={action}
              variant="secondary"
              size="md"
              onClick={() => onAction?.(action)}
              className="w-[200px]"
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
