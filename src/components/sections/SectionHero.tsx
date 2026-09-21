// Hero do Login (Figma node 1630:40) — a tela em que a plataforma se apresenta.
//
// Ordem de leitura, do mais alto ao mais baixo: o nome por extenso (a sigla
// explicada antes de ser usada), o logotipo, a jornada, o que a plataforma faz,
// a entrada, e só então os 4 pilares. O logotipo é o único elemento grande —
// todo o resto fica pequeno e quieto para que ele seja o que se vê primeiro.
//
// Os cards NÃO são clicáveis: no Login não há município escolhido nem sessão,
// então não há para onde navegar. Eles descrevem, não conduzem.
import PippaWordmark from '@/components/brand/PippaWordmark'
import Button from '../ui/buttons/Button'
import IconButton from '@/components/ui/buttons/IconButton'
import { buttonSizeStyles, buttonVariantStyles } from '../ui/buttons/button-styles'
import {
  Briefcase,
  ChartColumn,
  GraduationCap,
  Landmark,
  type LucideIcon,
} from '@/components/icons'
import { sectionContent } from '@/data/home/sections'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const ctaIcons: Record<string, LucideIcon> = {
  ambiente: ChartColumn,
  recursos: Landmark,
  capacitacao: GraduationCap,
  formulador: Briefcase,
}

export default function SectionHero() {
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleLogin() {
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

      <h1 className="w-full flex justify-center">
        <PippaWordmark className="block h-auto w-[clamp(220px,30dvh,413px)] text-primary" />
      </h1>

      <div className="flex flex-col items-center gap-lg px-lg">
        {/* Pílula: rótulo da jornada, não um controle. Sem <button> por baixo,
            senão receberia foco de teclado sem ter o que fazer. */}
        <p
          className={`${buttonVariantStyles.secondary} ${buttonSizeStyles.md.container} ${buttonSizeStyles.md.typo} rounded-full w-fit`}
        >
          {sectionContent.hero.subtitle}
        </p>
        <p className="typo-body text-center text-balance uppercase">
          {sectionContent.hero.description}
        </p>

        <Button label="Entrar" variant="primary" size="md" onClick={handleLogin} />

        {/* 4 pilares em grid 2×2. A largura sai da conta do Figma (2×466 + 64 de
            gap) e mora sozinha aqui: `max-w` junto de padding lateral espremeria
            o card, porque o padding entra no max-width com box-sizing: border-box. */}
        <ul className="grid grid-cols-2 auto-rows-[1fr] gap-x-2xl gap-y-md w-full max-w-[996px]">
          {sectionContent.jornadas.map((each) => {
            const Icon = ctaIcons[each.id]

            return (
              <li
                key={each.id}
                className="glass rounded p-md flex items-center gap-md text-left"
              >
                <IconButton icon={Icon} size="lg" decorative />

                <div className="flex flex-col gap-sm">
                  <h2 className="typo-title-md uppercase">{each.title}</h2>
                  <p className="typo-body-sm">{each.description}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
