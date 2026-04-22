// Tailwind pure — no Figma equivalent
// Padrão compartilhado: botão com ícone Info + Tooltip + hover accent.
// Usado em AgendaCard (Objetivo) e EconomicsCard (Sobre o indicador).

import Tooltip from '@/components/ui/Tooltip'
import { Info } from '@/components/icons'
import TitleSubtitle from './TitleSubtitle'
import IconButton from './buttons/IconButton'

interface InfoTooltipProps {
  label: string
  title: string
  subtitle: string
  trackingKey?: string
  className?: string
}

export default function InfoTooltip({
  title,
  subtitle,
  label,
  trackingKey,
}: InfoTooltipProps) {
  function content() {
    return (
      <TitleSubtitle title={title} subtitle={subtitle} size="sm"/>
    )
  }
  return (
    <Tooltip trackingKey={trackingKey} portal content={content()}>
        <IconButton
          icon={Info}
          size="sm"
          variant="ghost"
          aria-label={label}
        />
    </Tooltip>
  )
}
