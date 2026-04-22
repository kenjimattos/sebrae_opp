// Figma: User (405:2038)
// Avatar circle + user name

import { UserAvatar } from '@/components/icons'

interface UserProps {
  name?: string
  className?: string
}

export default function User({ name = 'João Maria', className = '' }: UserProps) {
  return (
    <div
      className={`flex items-center gap-xs h-[60px] rounded-full ${className}`}
    >
      <UserAvatar className="shrink-0" />
      <span className="typo-body whitespace-nowrap">
        {name}
      </span>
    </div>
  )
}
