// Consentimento de análise de uso (LGPD). Separado do aceite dos termos: o aceite é
// do servidor, por usuário, e é condição de uso; o consentimento é opcional, fica
// neste navegador e se revoga pelo menu da conta. Ficar no navegador evita rota nova
// na API (que teria de ser liberada no WAF); o custo é perguntar de novo em outra
// máquina. A chave leva o `sub` do AMEI: num computador compartilhado, o "sim" de
// uma pessoa não vale para a próxima.

export type ConsentChoice = 'granted' | 'denied'

const key = (userId: string) => `analytics-consent:${userId}`

// localStorage pode lançar (aba privada, site data bloqueado). Sem leitura, a
// resposta é "ainda não escolheu" — o banner volta, e nada carrega sem um "sim".
export function readConsent(userId: string): ConsentChoice | null {
  try {
    const v = localStorage.getItem(key(userId))
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

export function writeConsent(userId: string, choice: ConsentChoice): void {
  try {
    localStorage.setItem(key(userId), choice)
  } catch {
    // ver readConsent: a escolha vale para esta sessão e se pergunta de novo depois.
  }
}
