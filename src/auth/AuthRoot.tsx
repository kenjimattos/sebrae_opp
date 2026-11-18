import { useEffect, useState, type ReactNode } from 'react'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import { getKeycloak, keycloakInitOptions } from '@/auth/keycloak'
import Button from '@/components/ui/buttons/Button'

// Depois disto sem resposta, a tela de carregamento passa a dizer que está demorando.
// O keycloak-js tem timeout próprio de 10s em partes do init, mas há caminhos sem
// timeout (iframe que nunca responde): sem o aviso a tela ficava eterna e muda.
const SLOW_MS = 8000

function Screen({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="min-h-screen bg-background text-primary flex flex-col items-center justify-center gap-md p-md text-center typo-body">
      {children}
    </div>
  )
}

function SessionLoading() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Screen>
      <p>Verificando sessão…</p>
      {slow && (
        <>
          <p className="typo-body-sm">
            Está demorando mais que o normal. Confira a conexão (e a VPN, se for o caso) e tente de novo.
          </p>
          <Button label="Tentar de novo" onClick={() => window.location.reload()} />
        </>
      )}
    </Screen>
  )
}

// Envolve o app com o login AMEI. Sem este tratamento, qualquer falha no init do
// Keycloak (rede, VPN, iframe bloqueado) deixa `initialized` falso para sempre, e a
// pessoa vê "Verificando sessão…" sem fim e sem saber por quê.
export default function AuthRoot({ children }: { children: ReactNode }) {
  const [initError, setInitError] = useState<string | null>(null)

  if (initError !== null) {
    return (
      <Screen>
        <h1 className="typo-h3">Não foi possível verificar a sessão</h1>
        <p>Não conseguimos falar com o login do Sebrae (AMEI). Confira a conexão e tente de novo.</p>
        <p className="typo-body-sm">Detalhe técnico: {initError}</p>
        <Button label="Tentar de novo" onClick={() => window.location.reload()} />
      </Screen>
    )
  }

  return (
    <ReactKeycloakProvider
      authClient={getKeycloak()}
      initOptions={keycloakInitOptions}
      LoadingComponent={<SessionLoading />}
      onEvent={(event, error) => {
        if (event !== 'onInitError') return
        console.error('[auth] falha ao iniciar a sessão', error)
        const detail = error instanceof Error ? error.message : typeof error === 'string' ? error : 'erro desconhecido'
        setInitError(detail)
      }}
    >
      {children}
    </ReactKeycloakProvider>
  )
}
