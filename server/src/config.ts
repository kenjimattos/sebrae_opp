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
  if (!v) {
    // O erro mais comum: copiar do .env do frontend, onde as variáveis levam VITE_. O
    // servidor lê o nome SEM prefixo. Sem esta dica o log só diz "ausente", e quem olha o
    // .env vê a variável lá (com outro nome) e não entende por quê. Só sai no log de boot.
    const prefixada = process.env[`VITE_${name}`] ? ` — encontrei VITE_${name}: o servidor NÃO usa o prefixo VITE_ (só o frontend), renomeie para ${name}` : ''
    throw new Error(`Variável de ambiente obrigatória ausente: ${name} (ver server/.env.example)${prefixada}`)
  }
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
  // Login AMEI (Keycloak do Sebrae). Obrigatório, ao contrário da IA: sem ele a
  // API inteira ficaria aberta, e subir assim em silêncio é pior que não subir.
  // O client é o MESMO do SPA (público, PKCE), então não há secret por padrão —
  // `KEYCLOAK_CLIENT_SECRET` só existe se o Sebrae entregar um client confidencial.
  keycloak: {
    url: required('KEYCLOAK_URL'),
    realm: required('KEYCLOAK_REALM'),
    clientId: required('KEYCLOAK_CLIENT_ID'),
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || undefined,
    // Chave pública do realm, em base64 sem cabeçalho. Opcional: sem ela o
    // keycloak-connect busca o JWKS no AMEI e acompanha a rotação de chaves. Só
    // preencher se este servidor não alcançar o AMEI — chave fixa não rotaciona.
    realmPublicKey: process.env.KEYCLOAK_REALM_PUBLIC_KEY || undefined,
  },
  // Travas de volume do /api/ai (ver routes.ts e ia/quota.ts). Valores iniciais:
  // ajustar olhando o log de uso, não no chute.
  aiLimits: {
    perMinute: positiveInt('AI_RATE_PER_MIN', 10),
    perIpPerDay: positiveInt('AI_RATE_PER_DAY', 150),
    globalPerDay: positiveInt('AI_DAILY_CAP', 3000),
  },
}
