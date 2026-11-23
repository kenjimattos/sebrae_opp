// Microsoft Clarity (mapas de calor e replay). Só carrega DEPOIS do consentimento
// (ver AnalyticsProvider): quem recusa nunca baixa o script. O ID do projeto não é
// segredo — ele vai na URL do script que o navegador baixa —, por isso pode ter VITE_.
// Sem a variável (dev, testes) nada carrega e o banner de consentimento não aparece:
// pedir consentimento para algo que não roda seria enganoso.

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] }

declare global {
  interface Window {
    clarity?: ClarityFn
  }
}

// Formato do ID do painel (minúsculas e dígitos). Validar impede que um valor
// estranho na variável vire outra coisa dentro da URL do script.
const ID_PATTERN = /^[a-z0-9]{6,16}$/

export function clarityProjectId(): string | null {
  const raw = import.meta.env.VITE_CLARITY_PROJECT_ID
  const id = typeof raw === 'string' ? raw.trim() : ''
  return ID_PATTERN.test(id) ? id : null
}

const SCRIPT_ID = 'clarity-tag'

// Equivalente tipado do snippet oficial: cria a fila `window.clarity` (os comandos
// feitos antes de o script chegar ficam guardados nela) e injeta a tag. Idempotente.
export function loadClarity(projectId: string, userId: string): void {
  if (!document.getElementById(SCRIPT_ID)) {
    if (!window.clarity) {
      const fn: ClarityFn = (...args: unknown[]) => {
        ;(fn.q ??= []).push(args)
      }
      window.clarity = fn
    }
    const tag = document.createElement('script')
    tag.id = SCRIPT_ID
    tag.async = true
    tag.src = `https://www.clarity.ms/tag/${projectId}`
    document.head.appendChild(tag)
  }
  // O script só existe depois do "sim", então o consentimento é concedido na hora.
  // Vale também se o projeto estiver com "cookie consent" ligado no painel.
  window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' })
  // Só o `sub` do AMEI (opaco). Nunca nome, e-mail nem CPF.
  window.clarity?.('identify', userId)
}

// Revogação: apaga os cookies do Clarity. O script não se descarrega da página,
// então quem chama recarrega em seguida.
export function revokeClarity(): void {
  window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' })
}
