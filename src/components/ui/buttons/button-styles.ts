// Shared button variant styles and base class used by Button and IconButton.

export const buttonVariantStyles: Record<string, string> = {
  primary:
    'bg-[var(--semantic-button-primary)] text-[color:var(--semantic-button-label-primary)]',
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
  'inline-flex items-center justify-center rounded-full cursor-pointer transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)] focus-visible:ring-offset-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
