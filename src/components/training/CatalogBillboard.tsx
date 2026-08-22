// Tailwind pure — no Figma equivalent
// Billboard do catálogo /trilhas: abre a página com o acervo inteiro em uma
// ficha (trilhas, cursos, carga total) derivada de `catalogLoad` — os números
// não são digitados, então não têm como divergir das fileiras abaixo.

import { catalogLoad, formatHours } from '@/utils/courseLoad'
import { trails } from '@/data/home/training'
import { sectionContent } from '@/data/home/sections'
import PillButton from '@/components/ui/buttons/PillButton'

interface CatalogBillboardProps {
  /** Id da primeira fileira — alvo do CTA. */
  firstRowId: string
}

export default function CatalogBillboard({ firstRowId }: CatalogBillboardProps) {
  const { trailCount, courseCount, totalHours } = catalogLoad(trails)

  // Scroll manual em vez de href="#id": o PillButton só trata `/` como rota
  // interna — um href de hash viraria link externo (target="_blank").
  const scrollToFirstRow = () => {
    document.getElementById(firstRowId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="catalog-inset pt-2xl pb-lg">
      {/* min-w-0 impede que o título em Epic Pro (que não quebra palavra) estique
          a coluna além da viewport no mobile. */}
      <div className="flex flex-col items-start gap-md max-w-3xl min-w-0">
        <p className="typo-body-sm text-accent uppercase tracking-widest">
          Catálogo de capacitação
        </p>

        <h1 className="typo-h1 catalog-title uppercase">{sectionContent.trails.title}</h1>

        <p className="typo-body-lg">{sectionContent.trails.description}</p>

        {/* Ficha do acervo, derivada dos mesmos dados que alimentam as fileiras. */}
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
