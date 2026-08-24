// Tailwind pure — no Figma equivalent
// Bloco de resposta do LLM: ícone Sparkles + markdown + caret do typewriter.
// Fonte única das três superfícies que exibem texto gerado (ChatPanel,
// IndicatorModal, EconomicsAnalysis) — antes cada uma tinha sua cópia e a do
// Panorâma havia perdido o MarkdownLite pelo caminho, renderizando os
// **negritos** do modelo como texto cru.
//
// O typewriter mora aqui: quem consome passa `isTyping` e `onDone`. Para
// reiniciar a animação, monte o consumidor com uma `key` nova (mesmo contrato
// do useTypewriter).

import MarkdownLite from '@/components/ui/MarkdownLite'
import { useTypewriter } from '@/hooks/useTypewriter'
import { Sparkles, iconSizes } from '@/components/icons'

interface AiMessageProps {
  text: string
  /** Revela o texto caractere a caractere e mostra o caret. */
  isTyping?: boolean
  /** Chamado quando o typewriter termina. */
  onDone?: () => void
  /** Mensagem de falha — esmaece o texto. */
  isError?: boolean
  /** Sparkles à esquerda do texto. Falso quando o consumidor já tem o ícone no
   *  próprio cabeçalho (EconomicsAnalysis). */
  icon?: boolean
  /** Aplicado ao elemento externo (o wrapper com ícone, ou o próprio texto
   *  quando `icon` é falso). */
  className?: string
}

export default function AiMessage({
  text,
  isTyping = false,
  onDone,
  isError = false,
  icon = true,
  className = '',
}: AiMessageProps) {
  const { displayed } = useTypewriter({ text, enabled: isTyping, onDone })
  const shown = isTyping ? displayed : text

  const body = (
    <div
      className={`typo-body ${isError ? 'text-inactive' : ''} ${icon ? '' : className}`}
      aria-live={isTyping ? 'polite' : undefined}
    >
      <MarkdownLite text={shown} />
      {isTyping && <span className="typewriter-caret" aria-hidden />}
    </div>
  )

  if (!icon) return body

  return (
    <div className={`flex items-start gap-xs ${className}`}>
      <Sparkles size={iconSizes.sm} className="text-accent shrink-0 mt-[2px]" aria-hidden />
      {body}
    </div>
  )
}
