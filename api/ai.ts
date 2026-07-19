// Function serverless da Vercel para POST /api/ai. Fina de propósito: toda a
// lógica vive em api/_lib/handler.ts (compartilhada com o middleware de dev
// do Vite). A Vercel casa functions do filesystem antes dos rewrites do
// vercel.json, então /api/ai convive com o snapshot estático do preview.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleAiTask } from './_lib/handler'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.', code: 'bad_request' })
    return
  }
  const { status, body } = await handleAiTask(req.body, {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL,
  })
  res.status(status).json(body)
}
