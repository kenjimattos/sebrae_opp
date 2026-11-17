import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import './index.css'
import App from './App'
import { getKeycloak, keycloakInitOptions } from '@/auth/keycloak'

// O ReactKeycloakProvider fica por fora do App e só o monta depois do init do
// Keycloak: o retorno do AMEI traz `#state=…&code=…` na URL, e o keycloak-js a
// limpa no init. Montar antes deixaria o app (e qualquer analytics) ver essa URL.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactKeycloakProvider
      authClient={getKeycloak()}
      initOptions={keycloakInitOptions}
      LoadingComponent={
        <div role="status" className="min-h-screen bg-background text-primary flex-center typo-body">
          Verificando sessão…
        </div>
      }
    >
      <App />
    </ReactKeycloakProvider>
  </StrictMode>,
)
