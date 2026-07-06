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
}
