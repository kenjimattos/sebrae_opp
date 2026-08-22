// Shared button variant styles, sizes and base class used por Button, IconButton
// e Chip. Os tamanhos vivem aqui (e não dentro do Button) para que Chip seja
// visualmente idêntico ao Button por construção, não por cópia mantida à mão.

import type { IconSize } from '@/components/icons'

export const buttonVariantStyles: Record<string, string> = {
  primary:
    'bg-[var(--semantic-button-primary)] text-[color:var(--semantic-button-label-primary)]',
  secondary:
    'glass glass-bevel bg-[var(--semantic-button-secondary)] text-[color:var(--semantic-button-label-secondary)]',
  tertiary:
    'bg-[var(--semantic-button-tertiary)] text-[color:var(--semantic-button-label-tertiary)]',
  ghost:
    'bg-transparent text-[color:var(--semantic-text-primary)]',
  success:
    'bg-[var(--semantic-success)] text-[color:var(--primitives-white)]',
}


export type ButtonVariant = keyof typeof buttonVariantStyles

export interface ButtonSizeStyle {
  container: string
  typo: string
  iconSize: IconSize
}

export const buttonSizeStyles: Record<'sm' | 'md' | 'lg', ButtonSizeStyle> = {
  sm: { container: 'px-sm py-xs gap-2xs', typo: 'typo-button-sm', iconSize: 'xs' },
  md: { container: 'px-md py-sm gap-xs',  typo: 'typo-button',    iconSize: 'sm' },
  lg: { container: 'px-md py-sm gap-sm',  typo: 'typo-button-lg', iconSize: 'md' },
}

export type ButtonSize = keyof typeof buttonSizeStyles

export const buttonBaseClass =
  'hover:scale-[1.02] shrink-0 inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
