// Error boundary por seção/modo. Isola falhas de render (ex.: React error #31)
// para que uma seção que quebra não derrube a página inteira — o resto da Home
// (e, no caso dos modos, o SideNav/ModeToggle) continua utilizável.
//
// Reset: como boundaries não se recuperam sozinhos, o consumidor deve passar
// `key={…}` (ex.: o modo ativo) para remontar o boundary ao trocar de contexto.

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TriangleAlert, iconSizes } from '@/components/icons'
import { trackEvent } from '@/utils/analytics'

interface SectionErrorBoundaryProps {
  children: ReactNode
  // Nome da seção/modo — usado no log e no evento de analytics (snake_case pt).
  name: string
  className?: string
}

interface SectionErrorBoundaryState {
  hasError: boolean
}

export default class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SectionErrorBoundary] ${this.props.name}:`, error, info.componentStack)
    trackEvent('secao_com_erro', { secao: this.props.name, mensagem: error.message })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        role="alert"
        className={`card-surface flex flex-col items-center justify-center gap-sm p-lg text-center ${this.props.className ?? ''}`}
      >
        <TriangleAlert
          size={iconSizes.lg}
          className="text-[color:var(--semantic-alert)]"
          aria-hidden
        />
        <p className="typo-body-bold">Não foi possível carregar esta seção</p>
        <p className="typo-body-sm text-inactive">
          Tente recarregar a página. Se o problema persistir, avise a equipe.
        </p>
      </div>
    )
  }
}
