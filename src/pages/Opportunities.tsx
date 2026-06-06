// Página /oportunidades — placeholder de editais e programas de financiamento.
// Acessada pelo botão "Ver oportunidades" em SectionResources.

import { sectionContent } from '@/data/home/sections'

export default function Opportunities() {
  return (
    <div className="container">
      <section className="section-container">
          <h1
            className="typo-h1 text-center font-regular leading-[1.2]"
            dangerouslySetInnerHTML={{
              __html: sectionContent.opportunities.title.replace(
                /<highlight>(.*?)<\/highlight>/g,
                '<span style="color: var(--semantic-accent); font-weight: var(--typo-weight-bold)">$1</span>',
              ),
            }}
          />
          <p className="typo-body-lg text-center max-w-[800px] text-inactive">
            {sectionContent.opportunities.description}
          </p>
      </section>
    </div>
  )
}
