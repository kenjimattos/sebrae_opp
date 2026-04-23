// Página /comunidade — placeholder da Comunidade de prática em Inovação
// em Políticas Públicas. Acessada pelo botão "Entrar na comunidade"
// em SectionCaseStudies.

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SectionContainer from '@/components/ui/SectionContainer'
import { sectionContent } from '@/data/home/sections'

export default function Community() {
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-[1440px]">
        <SectionContainer className="items-center gap-lg">
          <h1
            className="typo-h1 text-center font-regular leading-[1.2]"
            dangerouslySetInnerHTML={{
              __html: sectionContent.community.title.replace(
                /<highlight>(.*?)<\/highlight>/g,
                '<span style="color: var(--semantic-accent); font-weight: var(--typo-weight-bold)">$1</span>',
              ),
            }}
          />
          <p className="typo-body-lg text-center max-w-[800px] text-inactive">
            {sectionContent.community.description}
          </p>
        </SectionContainer>
      </main>

      <Footer />
    </div>
  )
}
