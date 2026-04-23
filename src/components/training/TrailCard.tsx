// Tailwind pure — no Figma equivalent
// Card individual de um curso dentro da página /trilhas.
// Diferente do TrainingCard (que mostra o resumo da trilha no Home), este
// card exibe um único curso: carga no topo, título, descrição e CTA "ver curso".

import Card from '@/components/ui/Card'
import PillButton from '@/components/ui/buttons/PillButton'

interface TrailCardProps {
  id?: string
  title: string
  duration: string
  description?: string
  href?: string
  highlighted?: boolean
  scrollMarginTop?: number
  className?: string
}

const DEFAULT_DESCRIPTION =
  'Do diagnóstico do problema ao desenho de soluções estruturadas para o desenvolvimento local.'

export default function TrailCard({
  id,
  title,
  duration,
  description,
  href,
  highlighted = false,
  scrollMarginTop,
  className = '',
}: TrailCardProps) {
  const ring = highlighted
    ? 'outline outline-2 outline-[var(--semantic-accent)] outline-offset-2'
    : ''
  const hasLink = Boolean(href)

  return (
    <div
      id={id}
      className={`shrink-0 ${className}`}
      style={scrollMarginTop !== undefined ? { scrollMarginTop } : undefined}
    >
      <Card
        as="section"
        padding="lg"
        className={`flex flex-col w-[393px] h-[241px] justify-between card-hoverable ${ring}`}
      >
        <div className="flex flex-col gap-sm">
          <p className="typo-body-sm text-inactive">{duration}</p>
          <h4 className="typo-h4">{title}</h4>
          <p className="typo-body-sm">{description ?? DEFAULT_DESCRIPTION}</p>
        </div>
        <div className="flex justify-end">
          <PillButton
            variant="ghost"
            size="sm"
            label="ver curso"
            href={hasLink ? href : undefined}
            disabled={!hasLink}
          />
        </div>
      </Card>
    </div>
  )
}
