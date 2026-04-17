// Tailwind pure — no Figma equivalent
// Reusable hover/focus tooltip. Floating panel uses the Card primitive.

import { useState } from 'react'
import Card from '@/components/ui/Card'

type TooltipPlacement = 'top' | 'bottom'
type TooltipAlign = 'start' | 'end'

interface TooltipProps {
  content: React.ReactNode
  placement?: TooltipPlacement
  align?: TooltipAlign
  width?: number
  children: React.ReactNode
  className?: string
}

const placementClass: Record<TooltipPlacement, string> = {
  top: 'bottom-full mb-2xs',
  bottom: 'top-full mt-2xs',
}

const alignClass: Record<TooltipAlign, string> = {
  start: 'left-0',
  end: 'right-0',
}

export default function Tooltip({
  content,
  placement = 'bottom',
  align = 'end',
  width = 300,
  children,
  className = '',
}: TooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 ${placementClass[placement]} ${alignClass[align]}`}
          style={{ width }}
        >
          <Card
            surface="primary"
            padding="md"
            bordered
            className="typo-body-sm shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            {content}
          </Card>
        </span>
      )}
    </span>
  )
}
