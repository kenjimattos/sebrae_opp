// Cota diária do /api/ai: um teto por IP e um teto global. É a segunda das duas
// travas de volume (a primeira é a rajada por minuto, do @fastify/rate-limit em
// routes.ts). Existe porque o /api/ai está na internet sem login e cada chamada
// ao Vertex custa: o teto por IP segura um script num IP só, e o teto global é o
// disjuntor de custo contra quem distribui as chamadas por muitos IPs — esgotado,
// a IA fica fora até o dia virar, e o resto da API segue de pé.
//
// Em memória de propósito: a API é um processo só (systemd), e um disjuntor que
// zera no reinício é aceitável. O dia é o de Fortaleza (mesmo fuso de João
// Pessoa), não UTC — virar às 21h confundiria quem lê o log.

const TIME_ZONE = 'America/Fortaleza'

export interface QuotaLimits {
  perIpPerDay: number
  globalPerDay: number
}

export type QuotaDecision = 'ok' | 'ip' | 'global'

function dayKey(now: Date): string {
  // sv-SE formata como AAAA-MM-DD.
  return now.toLocaleDateString('sv-SE', { timeZone: TIME_ZONE })
}

export class DailyQuota {
  private day = ''
  private total = 0
  private readonly perIp = new Map<string, number>()
  private readonly limits: QuotaLimits
  // Relógio injetável: é o que deixa o teste virar o dia.
  private readonly now: () => Date

  constructor(limits: QuotaLimits, now: () => Date = () => new Date()) {
    this.limits = limits
    this.now = now
  }

  // Conta a chamada se couber e diz se coube. Recusada não conta: quem bateu no
  // teto não gasta o teto global dos outros.
  take(ip: string): QuotaDecision {
    const today = dayKey(this.now())
    if (today !== this.day) {
      this.day = today
      this.total = 0
      this.perIp.clear()
    }
    if (this.total >= this.limits.globalPerDay) return 'global'
    const used = this.perIp.get(ip) ?? 0
    if (used >= this.limits.perIpPerDay) return 'ip'
    this.perIp.set(ip, used + 1)
    this.total += 1
    return 'ok'
  }
}
