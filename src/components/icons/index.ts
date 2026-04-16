// Centralized icon exports
// Lucide icons used in the project (tree-shaken, only these are bundled)
// All consumers import icons from here — NEVER from 'lucide-react' directly.
export {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  ChartColumn,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  DollarSign,
  Landmark,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react'

// Type for icon components (accepts size, className, etc.)
export type { LucideIcon } from 'lucide-react'

// Custom icons (not available in Lucide)
export { default as UserAvatar } from './UserAvatar'
