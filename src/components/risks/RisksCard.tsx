// Figma: Risks/Card (set 563:4445) — redesenhado como "readout" de severidade.
// A cor do status entra por uma única CSS var (--risk) e tinge glow, número-herói,
// régua e rótulo. Estilos da classe .risk-card vivem em src/index.css.
// Mostra: número-herói + indicador, descrição do risco, severidade + contexto.

import type { CSSProperties } from 'react'
import type { StatusType } from '@/types/indicators'

interface RisksCardProps {
  label: string
  value: string | number
  type: StatusType
  description: string
  indicatorLabel: string
  context: string
  className?: string
}

// Cor do status que alimenta a peça via custom properties: --risk tinge número,
// régua e rótulo; --risk-glow tinge o halo e o brilho do ponto (no claro o halo
// é o pastel do matiz — glow do status escuro sobre branco vira mancha).
const riskAccent: Record<'alert' | 'warning', { risk: string; vivid: string; glow: string }> = {
  alert: {
    risk: 'var(--semantic-alert)',
    vivid: 'var(--semantic-alert-vivid)',
    glow: 'var(--semantic-alert-glow)',
  },
  warning: {
    risk: 'var(--semantic-warning)',
    vivid: 'var(--semantic-warning-vivid)',
    glow: 'var(--semantic-warning-glow)',
  },
}

export default function RisksCard({
  label,
  value,
  type,
  description,
  indicatorLabel,
  context,
  className = '',
}: RisksCardProps) {
  // 'success' não pode ser um risco — coage para 'warning' defensivamente.
  const effectiveType: 'alert' | 'warning' = type === 'alert' ? 'alert' : 'warning'

  return (
    <article
      tabIndex={0}
      style={{
        '--risk': riskAccent[effectiveType].risk,
        '--risk-vivid': riskAccent[effectiveType].vivid,
        '--risk-glow': riskAccent[effectiveType].glow,
      } as CSSProperties}
      className={`risk-card glass rounded p-lg flex flex-col gap-md h-full ${className}`}
    >
      {/* Número-herói + régua tingida */}
      <div className="flex flex-col gap-sm">
        <span className=" typo-display leading-none self-center">
          {value}
        </span>
        <hr className="risk-card__rule" />
      </div>

      <span className="typo-body-bold uppercase tracking-wide">
        {label}
      </span>

      {/* Descrição do risco */}
      <p className="typo-body">
        {description}
      </p>

      {/* Severidade (sinal ao vivo) + contexto, ancorados na base, à direita */}
      <footer className="mt-auto flex flex-col items-end gap-2xs text-right">
        <span className="flex items-center gap-xs">
          <span className="risk-card__dot" aria-hidden="true" />
          <span className="risk-card__label-accent typo-body-sm-bold uppercase tracking-[0.18em]">
            {indicatorLabel}
          </span>
        </span>
        <p className="typo-body-sm">
          {context}
        </p>
      </footer>
    </article>
  )
}
