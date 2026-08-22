// Tailwind pure — no Figma equivalent
// Billboard do catálogo /trilhas.
//
// O catálogo não tem imagem de curso — então a "arte" do billboard é o próprio
// acervo: a parede de horas repete a carga horária de cada um dos cursos como
// textura de fundo, com as cargas mais pesadas acesas no accent. É decorativa
// à distância e verdadeira de perto: nenhum número ali é inventado.

import { catalogLoad, formatHours } from '@/utils/courseLoad'
import { trails } from '@/data/home/training'
import { sectionContent } from '@/data/home/sections'
import PillButton from '@/components/ui/buttons/PillButton'

// Repetições da lista de cargas necessárias para preencher a parede em 1440px.
const WALL_REPEATS = 16
// A partir daqui a carga acende no accent — recorte que separa cursos longos
// (programas) dos de tomada rápida.
const HEAVY_HOURS = 40

interface CatalogBillboardProps {
  /** Id da primeira fileira — alvo do CTA. */
  firstRowId: string
}

export default function CatalogBillboard({ firstRowId }: CatalogBillboardProps) {
  const { trailCount, courseCount, totalHours, allHours } = catalogLoad(trails)
  const wall = Array.from({ length: WALL_REPEATS }, () => allHours).flat()

  // Scroll manual em vez de href="#id": o PillButton só trata `/` como rota
  // interna — um href de hash viraria link externo (target="_blank").
  const scrollToFirstRow = () => {
    document.getElementById(firstRowId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="catalog-inset relative overflow-hidden pt-2xl pb-lg">
      <div className="hours-wall" aria-hidden="true">
        {wall.map((hours, i) => (
          <span key={i} data-heavy={hours >= HEAVY_HOURS}>
            {hours}h
          </span>
        ))}
      </div>

      <div className="relative flex flex-col items-start gap-md max-w-3xl min-w-0">
        <p className="typo-body-sm text-accent uppercase tracking-widest">
          Catálogo de capacitação
        </p>

        <h1 className="typo-h1 catalog-title uppercase">{sectionContent.trails.title}</h1>

        <p className="typo-body-lg">{sectionContent.trails.description}</p>

        {/* Ficha do acervo — os mesmos números que desenham a parede atrás. */}
        <dl className="flex flex-wrap items-baseline gap-md typo-body-sm">
          <div className="flex items-baseline gap-2xs">
            <dt className="text-inactive">Trilhas</dt>
            <dd className="typo-body-sm-bold text-accent">{trailCount}</dd>
          </div>
          <div className="flex items-baseline gap-2xs">
            <dt className="text-inactive">Cursos</dt>
            <dd className="typo-body-sm-bold text-accent">{courseCount}</dd>
          </div>
          <div className="flex items-baseline gap-2xs">
            <dt className="text-inactive">Carga total</dt>
            <dd className="typo-body-sm-bold text-accent">{formatHours(totalHours)} horas</dd>
          </div>
        </dl>

        <PillButton
          label="Ver as trilhas"
          onClick={scrollToFirstRow}
          variant="primary"
          size="md"
          className="mt-xs"
        />
      </div>
    </section>
  )
}
