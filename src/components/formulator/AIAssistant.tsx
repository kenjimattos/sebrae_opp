// Figma: Formulador/AIAssistant (603:1803)
// Sidebar direita: bloco "Assistente IA" + descrição + bloco "Exemplo" com separador + bloco "Ações da IA".
// Conteúdo varia por etapa (src/data/formulator/ai-assistant.ts); as ações
// disparam gerações reais via useFormulatorAi (etapas sem ação: actions []).

import Card from '@/components/ui/Card'
import { Sparkles } from '@/components/icons'

export interface AIAssistantContent {
  description: string
  examples: string[]
}

interface AIAssistantProps {
  content: AIAssistantContent
  className?: string
}

export default function AIAssistant({
  content,
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
    </Card>
  )
}
