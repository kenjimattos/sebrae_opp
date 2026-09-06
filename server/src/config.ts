import 'dotenv/config'

// Lê e valida as variáveis de ambiente uma única vez no boot. Falha cedo (com
// mensagem clara) se faltar algo essencial — melhor do que erro obscuro de
// conexão mais tarde.
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
  // IA: opcionais de propósito. Sem a chave a API sobe normalmente e só o
  // /api/ai responde `missing_key` — que o frontend mostra como "O serviço de IA
  // não está configurado neste ambiente". Exigir a chave aqui derrubaria a API
  // inteira (indicadores, mapa, emendas) por causa de um recurso acessório.
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel: process.env.OPENROUTER_MODEL,
}
