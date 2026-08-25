// Tailwind pure — no Figma equivalent
// Primitivo de modal: portal em <body>, backdrop, Escape e click-fora fecham,
// scroll do body travado enquanto aberto. Painel usa o Card primitivo.
// O clique-fora aqui é o mousedown no backdrop (abaixo), não o listener de
// documento do useDismiss — o backdrop cobre a tela e já distingue dentro de
// fora sozinho.

import { createPortal } from 'react-dom'
import Card from '@/components/ui/Card'
import { useDismiss } from '@/hooks/useDismiss'
import IconButton from '@/components/ui/buttons/IconButton'
import { X } from '@/components/icons'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  // Classe Tailwind de largura máxima do painel.
  maxWidth?: string
  children: React.ReactNode
  className?: string
}

export default function Modal({
  open,
  onClose,
  title,
  maxWidth = 'max-w-[35dvw]',
  children,
  className = '',
}: ModalProps) {
  useDismiss({ active: open, onDismiss: onClose, lockScroll: true })

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex-center justify-center bg-black/60 p-md"
      onMouseDown={(e) => {
        // Só o click direto no backdrop fecha — não cliques dentro do painel.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidth} ${className}`}
      >
        <Card surface="primary" padding="lg" bordered className="shadow-lg">
          {title !== undefined && (
            <div className="flex-between mb-md gap-md">
              <h2 className="typo-h4">{title}</h2>
              <IconButton icon={X} variant="ghost" size="sm" aria-label="Fechar" onClick={onClose} />
            </div>
          )}
          {children}
        </Card>
      </div>
    </div>,
    document.body,
  )
}
