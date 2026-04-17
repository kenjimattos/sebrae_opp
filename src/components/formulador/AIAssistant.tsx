// Figma: Formulador/AIAssistant (603:1803)
// Sidebar direita: bloco "Assistente IA" + descrição + bloco "Exemplo" com separador + bloco "Ações da IA".
// Conteúdo varia por etapa (formulador-ai.ts). Os botões são no-op por enquanto (TODO: integração LLM).

import Card from '@/components/ui/Card'
import Button from '@/components/ui/buttons/Button'

export interface AIAssistantContent {
  descricao: string
  exemplos: string[]
  acoes: string[]
}

interface AIAssistantProps {
  content: AIAssistantContent
  onAction?: (acao: string) => void
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
        <p className="typo-body-sm">{content.descricao}</p>
      </div>

      <div className="flex flex-col items-start gap-md w-full">
        <p className="typo-body-bold">Exemplo</p>
        <div className="flex flex-col items-start gap-sm w-full">
          {content.exemplos.map((exemplo, i) => (
            <div key={i} className="w-full flex flex-col gap-sm">
              <p className="typo-body-sm">{exemplo}</p>
              {i < content.exemplos.length - 1 && <div className="divider" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-start gap-md w-full">
        <p className="typo-body-bold">Ações da IA</p>
        <div className="flex flex-col items-center gap-xs w-full">
          {content.acoes.map((acao) => (
            <Button
              key={acao}
              label={acao}
              variant="secondary"
              size="md"
              onClick={() => onAction?.(acao)}
              className="w-[200px]"
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
