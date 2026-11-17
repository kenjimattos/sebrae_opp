import { Link } from 'react-router-dom'
import TermsDocument from '@/components/terms/TermsDocument'

// Página pública (sem login): quem ainda vai entrar pode ler os termos antes.
// O `max-w` fica num filho sem padding — no mesmo elemento do gutter ele
// espremeria o texto (ver CLAUDE.md, "max-w-* no mesmo elemento que tem gutter").
export default function Terms() {
  return (
    <div className="section-container py-xl">
      <div className="max-w-3xl mx-auto flex flex-col gap-lg">
        <TermsDocument />
        <Link
          to="/"
          className="typo-body-sm underline w-fit rounded-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Voltar
        </Link>
      </div>
    </div>
  )
}
