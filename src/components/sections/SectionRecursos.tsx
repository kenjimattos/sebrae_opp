// Figma: Section/Resources (390:600)
// Emendas parlamentares + mapa Datapedia + editais e programas

import SectionContainer from '@/components/ui/SectionContainer'
import Card from '@/components/ui/Card'
import SectionHeader from '@/components/ui/SectionHeader'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import ResourcesCard from '@/components/resources/ResourcesCard'
import PillButton from '@/components/ui/buttons/PillButton'
import { sectionContent } from '@/data/sections'
import { DATAPEDIA_URL, resourceCards, recursosContent } from '@/data/recursos'

export default function SectionRecursos() {
  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.recursos.title} description={sectionContent.recursos.description}/>

      {/* Cards agrupados com gap menor */}
      <div className="flex flex-col gap-md">
      {/* Container principal branco */}
      <Card as="section" padding="lg" className="flex flex-col gap-3xl items-center">
          {/* Bloco 1 — Emendas parlamentares */}
          <div className="flex flex-col gap-xl items-start w-full">
            <TitleSubtitle
              title={recursosContent.emendas.title}
              subtitle={recursosContent.emendas.description}
            />

            <div className="flex flex-col gap-md w-full">
              <div className="grid-5">
                {resourceCards.map((card) => (
                  <ResourcesCard key={card.title} title={card.title} value={card.value} />
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
              subtitle={recursosContent.distribuicao.description}
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
        </Card>

        {/* Bloco 3 — Editais e programas */}
        <Card as="section" padding="lg" className="flex flex-col items-end gap-2xl">
          <TitleSubtitle
            title={recursosContent.editais.title}
            subtitle={recursosContent.editais.description}
            className="flex-1"
          />
          <PillButton label={recursosContent.buttons.verOportunidades} href="/oportunidades" className="shrink-0" />
        </Card>
      </div>

    </SectionContainer>
  )
}
