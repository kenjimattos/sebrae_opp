// Figma: Section/Resources (390:600)
// Emendas parlamentares + mapa Datapedia + editais e programas

import TitleSubtitle from '@/components/ui/TitleSubtitle'
import ResourcesCard from '@/components/resources/ResourcesCard'
import PillButton from '@/components/ui/buttons/PillButton'
import HoverOverlay from '@/components/ui/HoverOverlay'
import { DATAPEDIA_URL, resourceCards, resourcesContent } from '@/data/home/resources'
import { trackEvent } from '@/utils/analytics'

export default function ModeResources() {
  return (
    <div>
      {/* Cards agrupados com gap menor */}
      <div className="flex flex-col gap-md">
      {/* Container principal branco */}
      <div className="flex flex-col gap-3xl items-center">
          {/* Bloco 1 — Emendas parlamentares */}
          <div className="flex flex-col gap-xl items-start w-full">
            <TitleSubtitle
              title={resourcesContent.emendas.title}
              subtitle={resourcesContent.emendas.description}
            />

            <div className="flex flex-col gap-md w-full">
              <div className="grid-5">
                {resourceCards.map((card) => (
                  <ResourcesCard key={card.title} title={card.title} value={card.value} />
                ))}
              </div>

              <p className="typo-body max-w-[800px]">
                {resourcesContent.emendas.footnote}
              </p>
            </div>
          </div>

          {/* Bloco 2 — Mapa territorial (Datapedia) */}
          <div className="flex flex-col gap-xl items-start w-full">
            <TitleSubtitle
              title={resourcesContent.distribuicao.title}
              subtitle={resourcesContent.distribuicao.description}
            />

            <a
              href={DATAPEDIA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent('cta_externo_clicado', {
                  destino: DATAPEDIA_URL,
                  label: 'datapedia_mapa',
                })
              }
              className="block w-full rounded-md overflow-hidden bg-[var(--primitives-gray-900)] relative group"
            >
              <img
                src="/assets/datapedia-mapa.png"
                alt={resourcesContent.distribuicao.mapAlt}
                className="w-full h-auto object-cover rounded-xl"
              />

              <HoverOverlay label={resourcesContent.distribuicao.overlayLabel} radius="xl" />
            </a>
          </div>

          {/* Botão Explorar emendas */}
          <div className="flex justify-end w-full">
            <PillButton label={resourcesContent.buttons.explorarEmendas} href={DATAPEDIA_URL} />
          </div>
        </div>
      </div>
    </div>
  )
}
