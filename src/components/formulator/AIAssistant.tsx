// Figma: Formulador/AIAssistant (603:1803)
// Sidebar direita: bloco "Assistente IA" + descrição + bloco "Exemplo" com separador + bloco "Ações da IA".
// Conteúdo varia por etapa (src/data/formulator/ai-assistant.ts). O painel é
// só leitura: os botões de ação de IA saíram num refactor anterior, e a geração
// hoje acontece nos próprios campos (AiField) e nas etapas 7 e 8.

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
      radius="sm"
      className={`flex flex-col items-start gap-md ${className}`}
    >
      <div className="flex flex-col items-start gap-md w-full">
        <div className="flex items-center gap-sm">
          <Sparkles />
          <p className="typo-body-bold">Assistente IA</p>
        </div>
        <p className="typo-body-sm">{content.description}</p>
      </div>

      <div className="flex flex-col items-start gap-sm w-full">
        <p className="typo-body-bold">Exemplos:</p>
        <div className="flex flex-col items-start gap-sm w-full">
          {content.examples.map((example, i) => (
            <div key={i} className="w-full flex flex-col gap-xs">
              <p className="typo-body-sm">{example}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
