// Figma: Icons / Type=User (696:2636)
// Custom avatar icon — not available in Lucide

interface UserAvatarProps {
  size?: number
  className?: string
}

export default function UserAvatar({ size = 32, className = '' }: UserAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      <clipPath id="user-avatar-clip">
        <path d="M0 16C0 7.163 7.163 0 16 0s16 7.163 16 16-7.163 16-16 16S0 24.837 0 16Z" />
      </clipPath>
      <g clipPath="url(#user-avatar-clip)">
        <path
          d="M0 16C0 7.163 7.163 0 16 0s16 7.163 16 16-7.163 16-16 16S0 24.837 0 16Z"
          fill="currentColor"
          className="text-[var(--semantic-surface-primary)]"
        />
        <path
          d="M15.717 7.006c3.856-.156 7.111 2.838 7.276 6.694.166 3.855-2.82 7.118-6.675 7.293-3.87.176-7.145-2.823-7.311-6.692-.166-3.87 2.841-7.138 6.71-7.295Z"
          fill="currentColor"
          className="text-[var(--semantic-text-primary)]"
        />
        <path
          d="M15.034 23.012l.094-.002c.862-.016 2.278-.027 3.125.08 1.712.217 3.647.946 5.064 1.889.526.356 1.022.751 1.483 1.181.74.683 1.743 1.827 2.14 2.75.095.221.049 1.609.053 1.943.018 1.372-.023 2.776 0 4.148-3.308-.038-6.681-.005-9.995-.005l-7.827.001-2.55.001c-.516 0-1.093.01-1.604-.016l-.003-3.596c0-.43-.06-2.153.052-2.474.083-.24.236-.451.376-.663.436-.659.914-1.253 1.47-1.823 1.735-1.781 4.226-2.977 6.738-3.324.456-.063.922-.075 1.382-.09Z"
          fill="currentColor"
          className="text-[var(--semantic-text-primary)]"
        />
      </g>
    </svg>
  )
}
