import { MongoClient, type Db } from 'mongodb'
import { config } from './config.js'

// Cliente Mongo único (pool de conexões gerenciado pelo driver). Conecta no boot
// via connectDb() e é reutilizado por todos os repositórios.
let client: MongoClient | null = null
let database: Db | null = null

export async function connectDb(): Promise<Db> {
  if (database) return database
  client = new MongoClient(config.mongoUri)
  await client.connect()
  database = client.db(config.mongoDb)
  // Ping confirma que a conexão está viva antes de servir requisições.
  await database.command({ ping: 1 })
  return database
}

export function getDb(): Db {
  if (!database) throw new Error('DB não inicializado — chame connectDb() no boot antes de usar getDb().')
  return database
}

export async function closeDb(): Promise<void> {
  await client?.close()
  client = null
  database = null
}
