import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import AuthRoot from '@/auth/AuthRoot'

// O AuthRoot envolve o App com o ReactKeycloakProvider e só o monta depois do init
// do Keycloak: o retorno do AMEI traz `#state=…&code=…` na URL, e o keycloak-js a
// limpa no init. Montar antes deixaria o app (e qualquer analytics) ver essa URL.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthRoot>
      <App />
    </AuthRoot>
  </StrictMode>,
)
