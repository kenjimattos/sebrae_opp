import { useEffect, useState } from 'react'
import { termsSectionId, type TermsSection } from '@/data/terms/content'

// Linha de leitura: a seção ativa é a ÚLTIMA cujo topo já passou dela. Fica logo
// abaixo do header sticky (--header-h) mais um respiro, que é onde o topo de uma
// seção cai ao clicar no índice (scroll-padding-top do html): clicar em "8" marca "8".
const RESPIRO_PX = 40

function readingLine(): number {
  const root = getComputedStyle(document.documentElement)
  const rem = parseFloat(root.fontSize) || 16
  const raw = root.getPropertyValue('--header-h').trim()
  const header = raw.endsWith('rem') ? parseFloat(raw) * rem : parseFloat(raw)
  return (Number.isFinite(header) ? header : 4 * rem) + RESPIRO_PX
}

// Por posição de rolagem, não por IntersectionObserver: o observador só marca a seção
// que cruza uma faixa fixa, e as últimas, curtas, nunca chegam lá quando a página
// acaba (o 8 e o 9 nunca eram marcados). Aqui a última seção tem altura mínima
// (TermsDocument) para que o topo dela alcance a linha, e esta regra a escolhe.
function useActiveSection(sections: TermsSection[]): string | null {
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null)

  useEffect(() => {
    // Nove leituras de posição e nenhuma escrita no layout: barato o bastante para
    // rodar a cada evento de rolagem, e o `setActive` com o mesmo valor não re-renderiza.
    const update = () => {
      const line = readingLine()
      let current = sections[0]?.id ?? null
      for (const { id } of sections) {
        const el = document.getElementById(termsSectionId(id))
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [sections])

  return active
}

interface TermsTocProps {
  sections: TermsSection[]
  className?: string
}

// Índice dos termos. Em tela larga fica fixo ao lado do texto e marca a seção em
// leitura; abaixo disso vira um menu recolhível no topo (<details>).
export default function TermsToc({ sections, className = '' }: TermsTocProps) {
  const active = useActiveSection(sections)

  const links = (
    <ol className="flex flex-col">
      {sections.map((s) => {
        const current = s.id === active
        return (
          <li key={s.id}>
            <a
              href={`#${termsSectionId(s.id)}`}
              aria-current={current ? 'location' : undefined}
              className={`block border-l-2 py-xs pl-sm typo-body-sm transition-colors motion-reduce:transition-none rounded-r-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                current ? 'border-accent text-accent' : 'border-divider hover:text-accent'
              }`}
            >
              {s.title}
            </a>
          </li>
        )
      })}
    </ol>
  )

  return (
    <nav aria-label="Índice dos termos" className={className}>
      <details className="lg:hidden glass rounded p-sm">
        <summary className="typo-body-sm cursor-pointer">Índice</summary>
        <div className="pt-xs">{links}</div>
      </details>
      <div className="hidden lg:block">{links}</div>
    </nav>
  )
}
