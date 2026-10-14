// Hero da entrada (Figma node 2041:1815) — a tela em que a plataforma se
// apresenta e em que se escolhe a UF.
//
// Duas colunas. À esquerda, num painel glass, o que a plataforma é: logotipo,
// o que ela faz, a jornada e os 4 pilares. À direita, o que se faz aqui: o
// seletor de UF e o mapa do Brasil. A sigla por extenso fica acima das duas,
// porque explica o logotipo antes de ele aparecer.
//
// Não há botão "Entrar": escolher a Paraíba (no seletor ou no mapa) é a
// entrada. As outras UFs respondem ao hover e ao clique, mas não mudam a
// seleção — ela é fixa na Paraíba, a única com dados.
//
// Os cards dos pilares NÃO são clicáveis: antes de entrar não há para onde
// navegar. Eles descrevem, não conduzem.
import { useNavigate } from 'react-router-dom'
import PippaWordmark from '@/components/brand/PippaWordmark'
import IconButton from '@/components/ui/buttons/IconButton'
import StateSelector from '@/components/layout/StateSelector'
import { BrasilOutlineMap } from '@/components/map/BrasilOutlineMap'
import { buttonSizeStyles, buttonVariantStyles } from '../ui/buttons/button-styles'
import {
  Briefcase,
  ChartColumn,
  GraduationCap,
  Landmark,
  type LucideIcon,
} from '@/components/icons'
import { sectionContent } from '@/data/home/sections'
import { PB_UF_ID } from '@/data/geo/ufs'
import { useAuth } from '@/hooks/useAuth'

const ctaIcons: Record<string, LucideIcon> = {
  ambiente: ChartColumn,
  recursos: Landmark,
  capacitacao: GraduationCap,
  formulador: Briefcase,
}

export default function SectionHero() {
  const { login } = useAuth()
  const navigate = useNavigate()

  function enter() {
    login()
    navigate('/home')
  }

  return (
    <section className="section-container">
      <header className="flex items-center gap-md typo-title-sm uppercase">
        <span className="divider w-[69px] shrink-0" aria-hidden="true" />
        {sectionContent.hero.tagline}
        <span className="divider w-[69px] shrink-0" aria-hidden="true" />
      </header>

      <div className="grid w-full grid-cols-[minmax(0,511px)_minmax(0,1fr)] items-start gap-2xl">
        <div className="glass glass-bevel rounded flex flex-col gap-md p-lg">
          <h1>
            <PippaWordmark className="block h-auto w-[clamp(120px,16dvh,180px)] text-primary" />
          </h1>

          <p className="typo-body-sm uppercase">{sectionContent.hero.description}</p>

          {/* Pílula: rótulo da jornada, não um controle. Sem <button> por baixo,
              senão receberia foco de teclado sem ter o que fazer. */}
          <p
            className={`${buttonVariantStyles.secondary} ${buttonSizeStyles.md.container} ${buttonSizeStyles.md.typo} rounded-full w-full justify-center text-center`}
          >
            {sectionContent.hero.subtitle}
          </p>

          <ul className="flex flex-col gap-sm">
            {sectionContent.jornadas.map((each) => {
              const Icon = ctaIcons[each.id]

              return (
                <li
                  key={each.id}
                  className="glass rounded px-md py-sm flex items-center gap-md text-left"
                >
                  <IconButton icon={Icon} size="lg" decorative />

                  <div className="flex flex-col gap-2xs">
                    <h2 className="typo-title-md uppercase">{each.title}</h2>
                    <p className="typo-body-sm">{each.summary}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="flex flex-col items-center gap-xl">
          <StateSelector onEnter={enter} />
          <BrasilOutlineMap
            className="max-w-[640px]"
            selectedId={PB_UF_ID}
            tooltipDetail={(id) => (id === PB_UF_ID ? 'Clique para entrar' : 'Em breve')}
            onSelect={(id) => {
              if (id === PB_UF_ID) enter()
            }}
            fillColor="var(--semantic-background)"
            strokeColor="var(--semantic-text-primary)"
            hoverFillColor="var(--semantic-surface-secondary)"
          />
        </div>
      </div>
    </section>
  )
}
