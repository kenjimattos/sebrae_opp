// Figma: User (405:2038)
// Avatar circle + user name

import { UserAvatar } from '@/components/icons'
import { defaultUserName } from '@/data/labels'

interface UserProps {
  name?: string
  className?: string
}

export default function User({ name = defaultUserName, className = '' }: UserProps) {
  return (
    <div
      className={`flex items-center gap-xs h-[60px] px-md py-xs rounded-[var(--radius-full)] ${className}`}
    >
      <UserAvatar size={64} className="shrink-0" />
      <span className="typo-body-lg whitespace-nowrap">
        {name}
      </span>
    </div>
  )
}
