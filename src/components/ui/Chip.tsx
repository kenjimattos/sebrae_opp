// Tailwind pure — no Figma equivalent
// Chip: pill selecionável com estado de repouso/selecionado.
//
// Irmão do `ModeToggle`, não variante do `Button`. A diferença que justifica o
// componente próprio: no `Button` o visual vem de uma `variant` escolhida na
// chamada; aqui o estado vem de **dados** (`selected`), e o controle carrega
// semântica de seleção — que `Button` não expressa por não repassar `aria-*`.
//
// Quando usar cada um:
//   Button      → ação ("Salvar", "Gerar com IA")
//   Chip        → seleção entre pares, lado a lado, sem trocar de painel
//   ModeToggle  → troca de painel no lugar (role="tablist" + pill deslizante)
//
// Escopo deliberadamente mínimo — sem variantes, tamanhos ou ícone até haver
// um segundo consumidor pedindo. A matriz de variantes é o que faz um primitivo
// virar fábrica de div estilizada.

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
  disabled?: boolean
  className?: string
}

export default function Chip({
  label,
  selected = false,
  onClick,
  semantics = 'nav',
  disabled = false,
  className = '',
}: ChipProps) {
  // `aria-current` é omitido quando falso (a ausência já significa "não é o
  // atual"); `aria-pressed` precisa do valor explícito nos dois estados.
  const ariaState =
    semantics === 'nav'
      ? { 'aria-current': selected || undefined }
      : { 'aria-pressed': selected }

  const stateClass = selected
    ? 'bg-accent text-[color:var(--semantic-button-label-primary)]'
    : 'bg-surface text-inactive hover:text-[color:var(--semantic-text-primary)]'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...ariaState}
      className={`shrink-0 whitespace-nowrap rounded-full px-md py-xs typo-body-sm cursor-pointer transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${stateClass} ${className}`}
    >
      {label}
    </button>
  )
}
