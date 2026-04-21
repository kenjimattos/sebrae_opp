// Wrapper de analytics (Microsoft Clarity).
//
// Centraliza toda interação com Clarity em 3 funções (trackEvent, setTag,
// identifySession) + init/consent. Os componentes importam só daqui — se
// trocarmos de ferramenta (PostHog, GA4), a mudança fica isolada.
//
// Comportamento:
// - Só inicializa em build de produção (import.meta.env.PROD) e se
//   VITE_CLARITY_ID estiver preenchido. Em dev/preview vira no-op.
// - Só efetiva o init após o usuário dar consentimento (LGPD).
// - Se chamarem qualquer função antes do init, vira no-op silencioso.
//
// Docs do SDK: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-npm

import Clarity from '@microsoft/clarity'

const CONSENT_STORAGE_KEY = 'opp-clarity-consent'

type ConsentValue = 'granted' | 'denied'

let initialized = false

function getProjectId(): string | null {
  const id = import.meta.env.VITE_CLARITY_ID
  if (!id || typeof id !== 'string' || id.trim() === '') return null
  return id.trim()
}

function shouldEnable(): boolean {
  if (!import.meta.env.PROD) return false
  return getProjectId() !== null
}

export function getStoredConsent(): ConsentValue | null {
  try {
    const v = localStorage.getItem(CONSENT_STORAGE_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

function persistConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value)
  } catch {
    // Silencioso — storage bloqueado não deve quebrar a app.
  }
}

// Inicializa Clarity se possível. Chamado uma vez no bootstrap da app
// (se já houver consentimento armazenado) e de novo quando o usuário aceita
// o banner.
export function initAnalytics(): void {
  if (initialized) return
  if (!shouldEnable()) return
  const id = getProjectId()
  if (!id) return
  Clarity.init(id)
  initialized = true
}

export function grantConsent(): void {
  persistConsent('granted')
  initAnalytics()
  if (initialized) Clarity.consent(true)
}

export function denyConsent(): void {
  persistConsent('denied')
  // Sem init — nenhum script do Clarity é carregado.
}

type EventProps = Record<string, string | number | boolean>

// Dispara evento customizado. Props viram tags (scope = sessão atual) para
// permitir filtrar gravações no dashboard.
export function trackEvent(name: string, props?: EventProps): void {
  if (!initialized) return
  Clarity.event(name)
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      Clarity.setTag(`${name}.${key}`, String(value))
    }
  }
}

// Tag global (não ligada a um evento) — usado para marcar contexto persistente
// como município atual, ambiente, etc.
export function setTag(key: string, value: string): void {
  if (!initialized) return
  Clarity.setTag(key, value)
}

// Identifica a sessão do participante do teste (opcional).
// Ex: `?participante=p01` na URL → identifySession('p01').
export function identifySession(participantId: string): void {
  if (!initialized) return
  Clarity.identify(participantId)
}
