import { useEffect, useState } from 'react'
import { termsSectionId, type TermsSection } from '@/data/terms/content'

// Seção em leitura: a última cujo topo já passou da faixa de cima da tela. A faixa
// (20% do topo) deixa a seção ativa trocar um pouco antes de ela encostar no header.
function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null)

  useEffect(() => {
    // Sem IntersectionObserver (jsdom, navegador antigo) o índice só não marca nada.
    if (typeof IntersectionObserver === 'undefined') return
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id)
          else visible.delete(e.target.id)
        }
        const first = ids.find((id) => visible.has(termsSectionId(id)))
        if (first) setActive(first)
      },
      { rootMargin: '-20% 0px -65% 0px' },
    )
    for (const id of ids) {
      const el = document.getElementById(termsSectionId(id))
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [ids])

  return active
}

interface TermsTocProps {
  sections: TermsSection[]
  className?: string
}

// Índice dos termos. Em tela larga fica fixo ao lado do texto e marca a seção em
// leitura; abaixo disso vira um menu recolhível no topo (<details>).
export default function TermsToc({ sections, className = '' }: TermsTocProps) {
  const ids = sections.map((s) => s.id)
  const active = useActiveSection(ids)

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
