// Tailwind pure — no Figma equivalent
// Reusable tooltip with hover/click trigger. Floating panel uses the Card primitive.
// `followCursor` e `portal` renderizam o panel em <body> com position: fixed — escapa
// de stacking contexts criados por cards vizinhos no grid (ex.: transform em hover).

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
  // Renderiza o panel via portal em <body> com position: fixed. Use quando o
  // trigger está em stacking contexts irmãos (ex.: cards em grid com transform).
  portal?: boolean
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
const ANCHOR_OFFSET_PX = 4

export default function Tooltip({
  content,
  placement = 'bottom',
  align = 'end',
  width = 300,
  trigger = 'hover',
  followCursor = false,
  portal = false,
  children,
  className = '',
  trackingKey,
}: TooltipProps) {
  const [open, setOpen] = useState(false)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const trackedRef = useRef(false)

  function registerOpen() {
    setOpen(true)
    if (portal && ref.current) {
      setAnchorRect(ref.current.getBoundingClientRect())
    }
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
  const usePortalAnchor = portal && anchorRect && !followCursor

  let panelClass: string
  let panelStyle: React.CSSProperties
  if (useCursorPos) {
    panelClass = 'fixed z-50 pointer-events-none'
    panelStyle = { left: cursorPos.x + CURSOR_OFFSET_PX, top: cursorPos.y, width }
  } else if (usePortalAnchor) {
    panelClass = 'fixed z-50'
    const top =
      placement === 'bottom'
        ? anchorRect.bottom + ANCHOR_OFFSET_PX
        : anchorRect.top - ANCHOR_OFFSET_PX
    const left = align === 'end' ? anchorRect.right - width : anchorRect.left
    const transform = placement === 'top' ? 'translateY(-100%)' : undefined
    panelStyle = { top, left, width, transform }
  } else {
    panelClass = `absolute z-50 ${placementClass[placement]} ${alignClass[align]}`
    panelStyle = { width }
  }

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

  const shouldPortal = (useCursorPos || usePortalAnchor) && panel

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      {...interactionProps}
    >
      {children}
      {shouldPortal ? createPortal(panel, document.body) : panel}
    </div>
  )
}
