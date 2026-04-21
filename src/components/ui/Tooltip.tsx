// Tailwind pure — no Figma equivalent
// Reusable tooltip with hover/click trigger. Floating panel uses the Card primitive.
// In `followCursor` mode, the panel is portaled to <body> and position: fixed so it
// escapes sibling stacking contexts (e.g. adjacent cards in a grid).

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Card from '@/components/ui/Card'
import { trackEvent } from '@/utils/analytics'

type TooltipPlacement = 'top' | 'bottom'
type TooltipAlign = 'start' | 'end'
type TooltipTrigger = 'hover' | 'click'

interface TooltipProps {
  content: React.ReactNode
  placement?: TooltipPlacement
  align?: TooltipAlign
  width?: number
  trigger?: TooltipTrigger
  followCursor?: boolean
  children: React.ReactNode
  className?: string
  // Quando fornecido, dispara `tooltip_aberto` na primeira abertura do
  // componente (evita flood em tooltips hover ao reposicionar o cursor).
  trackingKey?: string
}

const placementClass: Record<TooltipPlacement, string> = {
  top: 'bottom-full mb-2xs',
  bottom: 'top-full mt-2xs',
}

const alignClass: Record<TooltipAlign, string> = {
  start: 'left-0',
  end: 'right-0',
}

const CURSOR_OFFSET_PX = 16

export default function Tooltip({
  content,
  placement = 'bottom',
  align = 'end',
  width = 300,
  trigger = 'hover',
  followCursor = false,
  children,
  className = '',
  trackingKey,
}: TooltipProps) {
  const [open, setOpen] = useState(false)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const trackedRef = useRef(false)

  function registerOpen() {
    setOpen(true)
    if (trackingKey && !trackedRef.current) {
      trackedRef.current = true
      trackEvent('tooltip_aberto', { chave: trackingKey })
    }
  }

  useEffect(() => {
    if (trigger !== 'click') return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [trigger])

  function updateCursorFromEvent(e: React.MouseEvent) {
    setCursorPos({ x: e.clientX, y: e.clientY })
  }

  const interactionProps =
    trigger === 'click'
      ? { onClick: () => (open ? setOpen(false) : registerOpen()) }
      : {
          onMouseEnter: (e: React.MouseEvent) => {
            if (followCursor) updateCursorFromEvent(e)
            registerOpen()
          },
          onMouseMove: followCursor
            ? (e: React.MouseEvent) => updateCursorFromEvent(e)
            : undefined,
          onMouseLeave: () => {
            setOpen(false)
            if (followCursor) setCursorPos(null)
          },
          onFocus: () => registerOpen(),
          onBlur: () => setOpen(false),
        }

  const useCursorPos = followCursor && cursorPos
  const panelClass = useCursorPos
    ? 'fixed z-50 pointer-events-none'
    : `absolute z-50 ${placementClass[placement]} ${alignClass[align]}`
  const panelStyle: React.CSSProperties = useCursorPos
    ? { left: cursorPos.x + CURSOR_OFFSET_PX, top: cursorPos.y, width }
    : { width }

  const panel = open ? (
    <div role="tooltip" className={panelClass} style={panelStyle}>
      <Card
        surface="primary"
        padding="md"
        bordered
        className="typo-body-sm shadow-lg"
      >
        {content}
      </Card>
    </div>
  ) : null

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      {...interactionProps}
    >
      {children}
      {useCursorPos && panel ? createPortal(panel, document.body) : panel}
    </div>
  )
}
