// Tailwind pure — no Figma equivalent
// Menu da conta, no header: um botão com ícone de usuário que abre um painel com o nome
// da pessoa logada, o link dos termos e o "Sair". Substitui o nome solto ao lado do
// ThemeToggle, que estourava a largura do header com nomes longos.
//
// Padrão de divulgação (botão + painel), não `role="menu"`: o painel tem um link e um
// botão comuns, e `menu` exigiria navegação por setas que ninguém espera aqui. O botão
// anuncia `aria-expanded`; Escape e clique fora fecham (useDismiss, o mesmo dos demais
// dropdowns) e o Escape devolve o foco ao botão.

import { useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, User, iconSizes } from '@/components/icons'
import { useDropdownState } from '@/components/ui/useDropdownState'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/hooks/useAuth'

const itemClass =
  'flex items-center gap-sm w-full px-sm py-xs rounded text-left typo-body cursor-pointer transition-colors hover:bg-surface-secondary hover:text-accent outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

interface UserMenuProps {
  className?: string
}

export default function UserMenu({ className = '' }: UserMenuProps) {
  const { isLoggedIn, user, logout } = useAuth()
  const analytics = useAnalytics()
  const { open, setOpen, ref } = useDropdownState()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  // /termos é pública: quem ainda não entrou não tem conta para abrir.
  if (!isLoggedIn || !user) return null

  return (
    // Sem `relative` de propósito: o painel (`absolute right-0`) se ancora no ancestral
    // posicionado mais próximo — hoje a pílula do SiteHeader —, não neste wrapper.
    <div
      ref={ref}
      className={className}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          setOpen(false)
          triggerRef.current?.focus()
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Minha conta"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        title="Minha conta"
        className={`inline-flex items-center justify-center shrink-0 w-[40px] h-[40px] rounded-full cursor-pointer transition-colors hover:bg-surface-secondary hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          open ? 'bg-surface-secondary text-accent' : 'text-primary'
        }`}
      >
        <User size={iconSizes.md} aria-hidden />
      </button>

      {open && (
        <div
          id={panelId}
          className="card-raised absolute right-0 top-full mt-xs z-50 w-[min(20rem,calc(100vw-2rem))] p-xs flex flex-col"
        >
          <div className="px-sm py-xs flex flex-col gap-2xs">
            {/* `data-clarity-mask`: o replay do Clarity não grava o nome.
                `break-words`: o nome do AMEI pode ser longo (já veio com o e-mail dentro). */}
            <p data-clarity-mask="true" className="typo-body-bold break-words">
              {user.name ?? 'Usuário'}
            </p>
            <p className="typo-body-sm text-inactive">Conta Sebrae (AMEI)</p>
          </div>

          <div className="divider my-xs" role="separator" />

          <Link to="/termos" onClick={() => setOpen(false)} className={itemClass}>
            Termos de uso e privacidade
          </Link>
          {/* Revogar o consentimento tem de ser tão fácil quanto dá-lo (LGPD). Só aparece
              com projeto do Clarity configurado: sem ele não há o que ligar. */}
          {analytics.available && (
            <button
              type="button"
              aria-pressed={analytics.choice === 'granted'}
              onClick={analytics.choice === 'granted' ? analytics.deny : analytics.grant}
              className={itemClass}
            >
              Análise de uso: {analytics.choice === 'granted' ? 'ligada' : 'desligada'}
            </button>
          )}
          <button type="button" onClick={logout} className={itemClass}>
            <LogOut size={iconSizes.sm} aria-hidden className="shrink-0" />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
