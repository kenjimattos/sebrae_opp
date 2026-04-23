// Banner LGPD de consentimento para analytics (Microsoft Clarity).
//
// Mostra uma única vez; após a escolha, persiste em localStorage e some.
// Só aparece se Clarity estiver habilitado no ambiente — em dev/preview fica
// oculto pra não poluir a UI durante desenvolvimento.

import { useState } from 'react'
import Button from '@/components/ui/buttons/Button'
import Card from '@/components/ui/Card'
import {
  denyConsent,
  getStoredConsent,
  grantConsent,
} from '@/utils/analytics'

export default function ConsentBanner() {
  const [visible, setVisible] = useState(
    () =>
      import.meta.env.PROD &&
      Boolean(import.meta.env.VITE_CLARITY_ID) &&
      getStoredConsent() === null,
  )

  if (!visible) return null

  function onAccept() {
    grantConsent()
    setVisible(false)
  }

  function onDecline() {
    denyConsent()
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-labelledby="opp-consent-title"
      className="fixed bottom-md left-md right-md z-[100] mx-auto max-w-[640px]"
    >
      <Card padding="lg" radius="sm" bordered className="flex flex-col gap-md shadow-lg">
        <div className="flex flex-col gap-xs">
          <h2 id="opp-consent-title" className="typo-body-lg-bold">
            Podemos registrar sua navegação?
          </h2>
          <p className="typo-body-sm">
            Para melhorar a Plataforma OPP, coletamos dados anônimos de
            navegação (cliques, rolagem e gravações de tela) usando o Microsoft
            Clarity. Nenhuma informação pessoal identificável é armazenada.
            Você pode recusar sem impacto na experiência.
          </p>
        </div>
        <div className="flex items-center gap-sm justify-end">
          <Button
            label="Recusar"
            variant="tertiary"
            size="md"
            onClick={onDecline}
          />
          <Button
            label="Aceitar"
            variant="primary"
            size="md"
            onClick={onAccept}
          />
        </div>
      </Card>
    </div>
  )
}
