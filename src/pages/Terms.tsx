import { Link } from 'react-router-dom'
import TermsDocument from '@/components/terms/TermsDocument'

// Página pública (sem login): quem ainda vai entrar pode ler os termos antes.
export default function Terms() {
  return (
    <div className="section-container py-xl">
      <TermsDocument>
        <Link
          to="/"
          className="typo-body-sm underline w-fit rounded-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Voltar
        </Link>
      </TermsDocument>
    </div>
  )
}
