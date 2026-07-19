// FAB do chat global. Fica na faixa de margem direita das sections
// (--spacing-gutter: 180px de padding-inline no .section-container): botão de
// 56px centrado no gutter — (180 − 56) / 2 = 62px da borda — não cobre
// conteúdo. Aberto, o ChatPanel desliza por cima (z-50) e o FAB some.

import { useState } from 'react'
import ChatPanel from '@/components/chat/ChatPanel'
import { MessageCircle, iconSizes } from '@/components/icons'

export default function ChatButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="Abrir assistente de IA"
          onClick={() => setOpen(true)}
          className="fixed bottom-[40px] right-[62px] z-40 w-[56px] h-[56px] rounded-full bg-accent text-white shadow-lg flex-center cursor-pointer transition-colors hover:bg-[var(--semantic-accent-hover)]"
        >
          <MessageCircle size={iconSizes.lg} aria-hidden />
        </button>
      )}
      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  )
}
