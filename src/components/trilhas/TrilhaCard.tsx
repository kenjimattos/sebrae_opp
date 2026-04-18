// Tailwind pure — no Figma equivalent
// Card individual de um curso dentro da página /trilhas.
// Diferente do CoursesCard (que mostra o resumo da trilha no Home), este
// card exibe um único curso: carga no topo, título, descrição e CTA "ver curso".

import Card from '@/components/ui/Card'
import PillButton from '@/components/ui/buttons/PillButton'
import { ctaLabels } from '@/data/labels'

interface TrilhaCardProps {
  id?: string
  titulo: string
  carga: string
  descricao?: string
  href?: string
  highlighted?: boolean
  scrollMarginTop?: number
  className?: string
}

const DEFAULT_DESCRICAO =
  'Do diagnóstico do problema ao desenho de soluções estruturadas para o desenvolvimento local.'

export default function TrilhaCard({
  id,
  titulo,
  carga,
  descricao,
  href = '#',
  highlighted = false,
  scrollMarginTop,
  className = '',
}: TrilhaCardProps) {
  const ring = highlighted
    ? 'outline outline-2 outline-[var(--semantic-accent)] outline-offset-2'
    : ''

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
          <p className="typo-body-sm text-inactive">{carga}</p>
          <h4 className="typo-h4">{titulo}</h4>
          <p className="typo-body-sm">{descricao ?? DEFAULT_DESCRICAO}</p>
        </div>
        <div className="flex justify-end">
          <PillButton variant="ghost" size="sm" label={ctaLabels.verCurso} href={href} />
        </div>
      </Card>
    </div>
  )
}
