import { useEffect, useRef, type RefObject } from 'react'

interface UseDismissOptions {
  /** Só registra os listeners enquanto verdadeiro. */
  active: boolean
  onDismiss: () => void
  /** Escape fecha. Default: true. */
  escape?: boolean
  /** Container do overlay — `mousedown` fora dele fecha. Ausente: não fecha por clique. */
  outsideRef?: RefObject<HTMLElement | null>
  /** Trava o scroll do <body> enquanto ativo (modais). Default: false. */
  lockScroll?: boolean
}

/**
 * Dispensa de overlay: Escape, clique fora e trava de scroll. Cada superfície
 * escolhe o que usa, mas todas usam a mesma implementação.
 *
 * Antes, Modal, Tooltip, ChatPanel e useDropdownState traziam sua própria
 * cópia — o Modal com um comentário dizendo que herdara o padrão do Tooltip —
 * e cada uma cobria um subconjunto diferente: só o Modal travava o scroll, só
 * Tooltip e Dropdown ouviam clique fora, o ChatPanel não fazia nem uma coisa
 * nem outra apesar de ser um painel fixo sobre a página. Subconjunto agora é
 * escolha declarada na chamada, não resultado de qual cópia se pegou.
 */
export function useDismiss({
  active,
  onDismiss,
  escape = true,
  outsideRef,
  lockScroll = false,
}: UseDismissOptions): void {
  // Consumidores passam closures novas a cada render; encaminhar por ref
  // mantém os listeners registrados uma vez só.
  const onDismissRef = useRef(onDismiss)
  useEffect(() => {
    onDismissRef.current = onDismiss
  })

  useEffect(() => {
    if (!active) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismissRef.current()
    }

    function handleOutside(e: MouseEvent) {
      const el = outsideRef?.current
      if (el && !el.contains(e.target as Node)) onDismissRef.current()
    }

    if (escape) document.addEventListener('keydown', handleEscape)
    if (outsideRef) document.addEventListener('mousedown', handleOutside)

    const previousOverflow = lockScroll ? document.body.style.overflow : null
    if (lockScroll) document.body.style.overflow = 'hidden'

    return () => {
      if (escape) document.removeEventListener('keydown', handleEscape)
      if (outsideRef) document.removeEventListener('mousedown', handleOutside)
      if (previousOverflow !== null) document.body.style.overflow = previousOverflow
    }
  }, [active, escape, outsideRef, lockScroll])
}
