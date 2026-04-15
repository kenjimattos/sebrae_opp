// Figma: Section/Resources (390:600)
// Emendas parlamentares + mapa Datapedia + editais e programas

import SectionContainer from '@/components/ui/SectionContainer'
import SectionCard from '@/components/ui/SectionCard'
import SectionHeader from '@/components/SectionHeader'
import TitleSubtitle from '@/components/TitleSubtitle'
import ResourcesCard from '@/components/resources/ResourcesCard'
import PillButton from '@/components/ui/PillButton'
import { sectionContent } from '@/data/sections'
import { DATAPEDIA_URL, resourceCards, recursosContent } from '@/data/recursos'

export default function SectionRecursos() {
  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.recursos.title} />

      {/* Cards agrupados com gap menor */}
      <div className="flex flex-col gap-md">
      {/* Container principal branco */}
      <SectionCard padding="xl" className="flex flex-col gap-3xl items-center">
          {/* Bloco 1 — Emendas parlamentares */}
          <div className="flex flex-col gap-xl items-start w-full">
            <TitleSubtitle
              title={recursosContent.emendas.title}
              content={recursosContent.emendas.description}
            />

            <div className="flex flex-col gap-md w-full">
              <div className="flex flex-wrap gap-xs">
                {resourceCards.map((card) => (
                  <ResourcesCard key={card.title} title={card.title} value={card.value} className="w-[211px]" />
                ))}
              </div>

              <p className="typo-body max-w-[800px]">
                {recursosContent.emendas.footnote}
              </p>
            </div>
          </div>

          {/* Bloco 2 — Mapa territorial (Datapedia) */}
          <div className="flex flex-col gap-xl items-start w-full">
            <TitleSubtitle
              title={recursosContent.distribuicao.title}
              content={recursosContent.distribuicao.description}
            />

            <a
              href={DATAPEDIA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full radius-xl overflow-hidden bg-[var(--primitives-gray-900)] relative group"
            >
              <img
                src="/assets/datapedia-mapa.png"
                alt={recursosContent.distribuicao.mapAlt}
                className="w-full h-auto object-cover radius-xl"
              />

              {/* Overlay no hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center radius-xl">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-surface typo-body-bold px-md py-sm radius-full shadow-lg">
                  {recursosContent.distribuicao.overlayLabel}
                </span>
              </div>
            </a>
          </div>

          {/* Botão Explorar emendas */}
          <div className="flex justify-end w-full">
            <PillButton label={recursosContent.buttons.explorarEmendas} href={DATAPEDIA_URL} />
          </div>
        </SectionCard>

        {/* Bloco 3 — Editais e programas */}
        <SectionCard padding="xl" className="py-3xl flex items-center gap-2xl">
          <TitleSubtitle
            title={recursosContent.editais.title}
            content={recursosContent.editais.description}
            className="flex-1"
          />
          <PillButton label={recursosContent.buttons.verOportunidades} href="#" className="shrink-0" />
        </SectionCard>
      </div>

    </SectionContainer>
  )
}
