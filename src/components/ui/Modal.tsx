// Tailwind pure — no Figma equivalent
// Primitivo de modal: portal em <body>, backdrop, Escape e click-fora fecham,
// scroll do body travado enquanto aberto. Painel usa o Card primitivo.
// Padrões de dismiss herdados de ui/Tooltip.tsx (trigger 'click').

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Card from '@/components/ui/Card'
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
  useEffect(() => {
    if (!open) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

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
        <Card surface="primary" padding="lg" bordered radius="md" className="shadow-lg">
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
