// Shared button variant styles and base class used by Button and IconButton.

export const buttonVariantStyles: Record<string, string> = {
  primary:
    'glass glass-bevel bg-[var(--semantic-button-primary)] text-[color:var(--semantic-text-primary)]',
  secondary:
    'bg-[var(--semantic-button-secondary)] text-[color:var(--semantic-button-label-secondary)]',
  tertiary:
    'bg-[var(--semantic-button-tertiary)] text-[color:var(--semantic-button-label-tertiary)]',
  ghost:
    'bg-transparent text-[color:var(--semantic-text-primary)]',
  success:
    'bg-[var(--semantic-success)] text-[color:var(--primitives-white)]',
}


export type ButtonVariant = keyof typeof buttonVariantStyles

export const buttonBaseClass =
  'hover:scale-[1.02] rounded-full shrink-0 inline-flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)] focus-visible:ring-offset-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
