// Figma: Section/Resources (390:600)
// Emendas parlamentares + mapa Datapedia + editais e programas

import TitleSubtitle from '@/components/ui/TitleSubtitle'
import Button from '@/components/ui/buttons/Button'
import HoverOverlay from '@/components/ui/HoverOverlay'
import { DATAPEDIA_URL, resourceCards, resourcesContent } from '@/data/home/resources'
import { trackEvent } from '@/utils/analytics'

export default function ModeResources() {
  return (
    <>
      {/* Container principal branco */}
      <div className="flex flex-col glass rounded-sm p-lg items-center gap-lg">
          <TitleSubtitle
            size='md'
            title={resourcesContent.emendas.title}
            subtitle={resourcesContent.emendas.description}
            className='w-full'
          />
          <div className="flex w-full gap-md">
            {/* Bloco 1 — Emendas parlamentares */}
            <div className="flex flex-col gap-xs w-1/2">
              <p className="typo-body-sm">
                {resourcesContent.emendas.tableTitle}
              </p>
              <div className="flex flex-col gap-sm w-full border p-md">

                  {resourceCards.map((card, i) => (
                    <>
                    <div className="flex justify-between">
                      <span className="typo-body-sm-bold">{card.title}</span>
                      <span className="typo-display-sm">{card.value}</span>
                    </div>
                    {i < 4 && (<hr className="border-accent border-dashed pb-xs" />
                    )}
                    </>
                  ))}
              </div>
              <p className="typo-body-sm">
                {resourcesContent.emendas.footnote}
              </p>
            </div>

            {/* Bloco 2 — Mapa territorial (Datapedia) */}
            <div className="flex flex-col gap-xs w-1/2">
              <p className="typo-body-sm">
                {resourcesContent.distribuicao.description}
              </p>
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
                className="block w-full rounded-sm overflow-hidden bg-[var(--primitives-gray-900)] relative group"
              >
                <img
                  src="/assets/datapedia-mapa.png"
                  alt={resourcesContent.distribuicao.mapAlt}
                  className="w-full object-cover rounded-sm"
                />

                <HoverOverlay label={resourcesContent.distribuicao.overlayLabel} radius="xl" />
              </a>
            </div>
          </div>
        <Button label={resourcesContent.buttons.explorarEmendas} variant='secondary' className='w-fit'/>
      </div>
    </>
  )
}
