// Reusable circular arrow button for scroll navigation

import type { LucideIcon } from '@/components/icons'
import { ICON_SIZES } from '@/constants/icons'

interface ScrollArrowButtonProps {
  icon: LucideIcon
  onClick: () => void
  ariaLabel: string
}

export default function ScrollArrowButton({ icon: Icon, onClick, ariaLabel }: ScrollArrowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center w-[48px] h-[48px] bg-surface radius-full transition-opacity hover:opacity-70"
      aria-label={ariaLabel}
    >
      <Icon size={ICON_SIZES.lg} />
    </button>
  )
}
