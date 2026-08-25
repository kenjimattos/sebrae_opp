// Tailwind pure — no Figma equivalent
// Controle de tema: cicla automático → claro → escuro.
//
// Por que ciclo e não ModeToggle: o ModeToggle é um tablist que troca o painel
// no lugar, com os pares visíveis lado a lado. Aqui os três estados não são
// painéis irmãos e o controle flutua sobre o conteúdo — um botão que avança o
// estado, anunciando qual está ativo, custa um alvo em vez de três.
//
// Montado uma vez só, no Layout (topo à direita, sobre todas as rotas).
//
// A11y: o ícone sozinho não diz qual tema está ativo para quem não o vê, então
// o aria-label carrega o estado atual (não a ação). O botão continua focado
// depois do clique, então o leitor de tela reanuncia o rótulo já atualizado —
// uma região aria-live aqui só duplicaria a fala.

import { useTheme, THEME_LABELS } from '@/hooks/useTheme'
import { Laptop, Moon, Sun, iconSizes, type LucideIcon } from '@/components/icons'
import type { ThemePreference } from '@/hooks/useTheme'

const themeIcon: Record<ThemePreference, LucideIcon> = {
  auto: Laptop,
  light: Sun,
  dark: Moon,
}

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { preference, cycleTheme } = useTheme()
  const Icon = themeIcon[preference]

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={THEME_LABELS[preference]}
      title={THEME_LABELS[preference]}
      className={`inline-flex items-center justify-center shrink-0 w-[40px] h-[40px] rounded-full text-primary cursor-pointer transition-colors hover:bg-surface-secondary hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      <Icon size={iconSizes.md} aria-hidden />
    </button>
  )
}
