import 'dotenv/config'
import { vertexEnvFrom } from '../../api/_lib/vertex.js'

// Lê e valida as variáveis de ambiente uma única vez no boot. Falha cedo (com
// mensagem clara) se faltar algo essencial — melhor do que erro obscuro de
// conexão mais tarde.
// Inteiro positivo de env, ou o default. Valor inválido não derruba o boot:
// avisa e segue com o default, porque é ajuste fino, não conexão.
function positiveInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const n = Number(raw)
  if (Number.isInteger(n) && n > 0) return n
  console.warn(`[config] ${name}=${raw} inválido, usando ${fallback}`)
  return fallback
}

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Variável de ambiente obrigatória ausente: ${name} (ver server/.env.example)`)
  return v
}

export const config = {
  mongoUri: required('MONGO_URI'),
  mongoDb: process.env.MONGO_DB ?? 'DadosOPP',
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  // IA: opcional de propósito. Sem a service account a API sobe normalmente e só
  // o /api/ai responde `unavailable` — que o frontend mostra como "O assistente
  // está indisponível no momento" (o motivo real vai para o log). Exigi-la aqui
  // derrubaria a API inteira (indicadores, mapa, emendas) por causa de um
  // recurso acessório.
  vertex: vertexEnvFrom(process.env),
  // Travas de volume do /api/ai (ver routes.ts e ia/quota.ts). Valores iniciais:
  // ajustar olhando o log de uso, não no chute.
  aiLimits: {
    perMinute: positiveInt('AI_RATE_PER_MIN', 10),
    perIpPerDay: positiveInt('AI_RATE_PER_DAY', 150),
    globalPerDay: positiveInt('AI_DAILY_CAP', 3000),
  },
}
