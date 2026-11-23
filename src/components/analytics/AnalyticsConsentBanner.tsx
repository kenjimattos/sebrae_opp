// Tailwind pure — no Figma equivalent
// Pedido de consentimento do Clarity. O TermsGate o monta depois do aceite dos
// termos, por cima da Home: é um pedido à parte e recusar não tira nada da pessoa.
// No canto esquerdo porque o direito é do ChatButton. Não é modal: a plataforma
// funciona igual com ele aberto, e um modal faria o "sim" parecer condição de uso.

import { Link } from 'react-router-dom'
import Button from '@/components/ui/buttons/Button'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function AnalyticsConsentBanner() {
  const { available, choice, grant, deny } = useAnalytics()
  if (!available || choice !== null) return null

  return (
    <section
      aria-labelledby="analytics-consent-title"
      className="fixed bottom-lg left-lg z-40 card-raised p-md w-[min(28rem,calc(100vw-2rem))] flex flex-col gap-sm"
    >
      <h2 id="analytics-consent-title" className="typo-body-bold">
        Análise de uso
      </h2>
      <p className="typo-body-sm">
        Podemos registrar como você navega (cliques e rolagem, com campos de texto e seu nome
        ocultos) para melhorar a plataforma? É opcional: recusar não muda nada no uso, e você
        pode mudar de ideia no menu da conta.{' '}
        <Link
          to="/termos#termos-analise-de-uso"
          className="underline rounded-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Saiba mais
        </Link>
      </p>
      <div className="flex gap-sm">
        <Button label="Aceitar" size="sm" onClick={grant} />
        <Button label="Recusar" size="sm" variant="secondary" onClick={deny} />
      </div>
    </section>
  )
}
