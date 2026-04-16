// Icon size tokens — mirrors --icon-size-* CSS variables in index.css
// Used as numeric size prop for Lucide icons (which accept a number, not CSS var)

export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const

export type IconSize = keyof typeof ICON_SIZES
