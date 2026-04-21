// Centralized icon exports
// Lucide icons used in the project (tree-shaken, only these are bundled)
// All consumers import icons from here — NEVER from 'lucide-react' directly.

// Design tokens — single source of truth for icon sizes
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const

export type IconSize = keyof typeof iconSizes

export {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleDot,
  GraduationCap,
  DollarSign,
  Info,
  Landmark,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'

// Type for icon components (accepts size, className, etc.)
export type { LucideIcon } from 'lucide-react'

// Custom icons (not available in Lucide)
export { default as UserAvatar } from './UserAvatar'
