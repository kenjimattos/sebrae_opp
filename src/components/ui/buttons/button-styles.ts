// Shared button variant styles, sizes and base class used por Button, IconButton
// e Chip. Os tamanhos vivem aqui (e não dentro do Button) para que Chip seja
// visualmente idêntico ao Button por construção, não por cópia mantida à mão.

import type { IconSize } from '@/components/icons'

export const buttonVariantStyles: Record<string, string> = {
  primary:   'bg-button-primary text-button-label-primary',
  secondary: 'glass glass-bevel bg-button-secondary text-button-label-secondary',
  tertiary:  'bg-button-tertiary text-button-label-tertiary',
  ghost:     'bg-transparent text-primary',
  success:   'bg-success text-button-label-success',
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
  'hover:scale-[1.02] shrink-0 inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-[0.98] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
