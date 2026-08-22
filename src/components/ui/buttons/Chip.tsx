// Tailwind pure — no Figma equivalent
// Chip: controle selecionável, visualmente idêntico ao `Button`.
//
// Compartilha shell, variantes e tamanhos com o Button pelo `button-styles.ts`
// — por construção, não por cópia: mudar o Button muda o Chip junto.
//
// O que justifica o componente próprio não é o visual, é a API. No Button o
// estado vem de uma `variant` escolhida na chamada; aqui vem de **dados**
// (`selected`), e o controle anuncia essa seleção a leitores de tela, coisa que
// o Button não faz por não repassar `aria-*`.
//
// Quando usar cada um:
//   Button      → ação ("Salvar", "Gerar com IA")
//   Chip        → seleção entre pares, lado a lado, sem trocar de painel
//   ModeToggle  → troca de painel no lugar (role="tablist" + pill deslizante)

import {
  buttonBaseClass,
  buttonVariantStyles,
  buttonSizeStyles,
  type ButtonSize,
  type ButtonVariant,
} from './button-styles'

type ChipSemantics = 'nav' | 'toggle'

interface ChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
  /**
   * Como o estado é anunciado a leitores de tela:
   * - `nav`    → `aria-current` — o item corresponde ao conteúdo em foco agora
   * - `toggle` → `aria-pressed` — o item liga/desliga algo
   */
  semantics?: ChipSemantics
  size?: ButtonSize
  /** Variante no estado selecionado / de repouso. */
  selectedVariant?: ButtonVariant
  restingVariant?: ButtonVariant
  disabled?: boolean
  className?: string
}

export default function Chip({
  label,
  selected = false,
  onClick,
  semantics = 'nav',
  size = 'sm',
  selectedVariant = 'primary',
  restingVariant = 'secondary',
  disabled = false,
  className = '',
}: ChipProps) {
  const s = buttonSizeStyles[size]

  // `aria-current` é omitido quando falso (a ausência já significa "não é o
  // atual"); `aria-pressed` precisa do valor explícito nos dois estados.
  const ariaState =
    semantics === 'nav'
      ? { 'aria-current': selected || undefined }
      : { 'aria-pressed': selected }

  const variant = selected ? selectedVariant : restingVariant

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...ariaState}
      // Mesma ordem de classes do Button — o shell é o dele. `whitespace-nowrap`
      // é o único acréscimo: chip vive em fileira rolável e não pode quebrar.
      className={`${buttonBaseClass} ${buttonVariantStyles[variant]} ${s.container} ${s.typo} whitespace-nowrap ${className} rounded-full w-fit`}
    >
      {label}
    </button>
  )
}
