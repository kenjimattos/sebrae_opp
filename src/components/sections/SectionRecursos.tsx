// Figma: Section/Resources (390:600)
// Emendas parlamentares + mapa Datapedia + editais e programas

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/SectionHeader'
import TitleSubtitle from '@/components/TitleSubtitle'
import ResourcesCard from '@/components/resources/ResourcesCard'
import PillButton from '@/components/ui/PillButton'
import { sectionContent } from '@/data/sections'

const DATAPEDIA_URL =
  'https://datapedia.info/sebrae/conexao/po5aavozprm7z6+-ppswzktavzqb1p3k/ta6dedoanvp1a5d96p6hv9dq77dp64ia'

export default function SectionRecursos() {
  return (
    <SectionContainer className="flex flex-col gap-[var(--spacing-md)] py-[var(--spacing-lg)]">
      <SectionHeader title={sectionContent.recursos.title} />

      {/* Container principal branco */}
      <div className="bg-[var(--semantic-surface-primary)] rounded-[var(--radius-sm)] px-[var(--spacing-xl)] pb-[var(--spacing-3xl)] flex flex-col gap-[var(--spacing-3xl)] items-center">
        {/* Pill no topo */}
        <div className="bg-[var(--semantic-surface-secondary)] rounded-b-[var(--radius-xl)] px-[var(--spacing-2xl)] py-[var(--spacing-sm)]">
          <span className="font-bold text-[length:var(--font-size-h3)] text-[color:var(--semantic-text-primary)] text-center whitespace-nowrap">
            Onde encontrar recursos para o município
          </span>
        </div>

        {/* Bloco 1 — Emendas parlamentares */}
        <div className="flex flex-col gap-[var(--spacing-xl)] items-start w-full">
          <TitleSubtitle
            title="Emendas parlamentares disponíveis"
            content="Recursos destinados por deputados federais e senadores que podem financiar projetos estruturantes no município."
            variant="h2"
          />

          <div className="flex flex-col gap-[var(--spacing-md)] w-full">
            <div className="flex flex-wrap gap-[var(--spacing-sm)]">
              <ResourcesCard title="Total empenhado até o momento" value="R$ 4,1 bilhões" className="w-[211px]" />
              <ResourcesCard title="Total pago até o momento" value="R$ 3,3 bilhões" className="w-[211px]" />
              <ResourcesCard title="Pago em 2023" value="R$ 649,2 milhões" className="w-[211px]" />
              <ResourcesCard title="Pago em 2024" value="R$ 1,2 bilhões" className="w-[211px]" />
              <ResourcesCard title="Pago em 2025" value="R$ 1,4 bilhões" className="w-[211px]" />
            </div>

            <p className="font-normal text-[length:var(--font-size-body-lg)] leading-normal text-[color:var(--semantic-text-primary)] max-w-[800px]">
              Recursos federais representam uma das principais fontes de financiamento para projetos estruturantes nos municípios.
            </p>
          </div>
        </div>

        {/* Bloco 2 — Mapa territorial (Datapedia) */}
        <div className="flex flex-col gap-[var(--spacing-xl)] items-start w-full">
          <TitleSubtitle
            title="Distribuição territorial das emendas"
            content="Veja como os recursos federais estão distribuídos entre os municípios do estado."
            variant="h2"
          />

          <a
            href={DATAPEDIA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-[var(--radius-xl)] overflow-hidden bg-[var(--primitives-gray-900)] relative group"
          >
            <img
              src="/assets/datapedia-mapa.png"
              alt="Mapa de distribuição territorial das emendas — Datapedia"
              className="w-full h-auto object-cover rounded-[var(--radius-xl)]"
            />

            {/* Overlay no hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center rounded-[var(--radius-xl)]">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--semantic-surface-primary)] text-[color:var(--semantic-text-primary)] font-semibold text-[length:var(--font-size-body)] px-[var(--spacing-md)] py-[var(--spacing-sm)] rounded-[var(--radius-full)] shadow-lg">
                Abrir no Datapedia →
              </span>
            </div>
          </a>
        </div>

        {/* Botão Explorar emendas */}
        <div className="flex justify-end w-full">
          <PillButton label="Explorar emendas" href={DATAPEDIA_URL} />
        </div>
      </div>

      {/* Ícone decorativo $ entre containers */}
      <div className="flex justify-center -my-[var(--spacing-md)]">
        <div className="w-[120px] h-[120px] bg-[var(--semantic-surface-primary)] rounded-full flex items-center justify-center shadow-lg">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Bloco 3 — Editais e programas */}
      <div className="bg-[var(--semantic-surface-primary)] rounded-[var(--radius-sm)] px-[var(--spacing-xl)] py-[var(--radius-full)] flex items-center gap-[var(--spacing-2xl)]">
        <TitleSubtitle
          title="Editais e programas de financiamento"
          content="Programas federais, estaduais e institucionais com recursos disponíveis para desenvolvimento econômico, inovação e fortalecimento de pequenos negócios."
          variant="h2"
          className="flex-1"
        />
        <PillButton label="Ver oportunidades" href="#" className="shrink-0" />
      </div>
    </SectionContainer>
  )
}
