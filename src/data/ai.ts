// Client do endpoint de IA (/api/ai). Em dev o middleware do Vite atende;
// na Vercel, a function api/ai.ts. Mesmas convenções de src/data/api.ts.
import type { AiErrorCode, AiErrorResponse, AiSuccessResponse, AiTaskRequest } from '@/types/ai'

export class AiRequestError extends Error {
  code: AiErrorCode

  constructor(code: AiErrorCode, message: string) {
    super(message)
    this.name = 'AiRequestError'
    this.code = code
  }
}

export async function postAiTask(req: AiTaskRequest): Promise<AiSuccessResponse> {
  let res: Response
  try {
    res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
  } catch {
    throw new AiRequestError('upstream_error', 'falha de rede ao chamar /api/ai')
  }

  const body = (await res.json().catch(() => null)) as
    | AiSuccessResponse
    | AiErrorResponse
    | null

  if (!res.ok || body === null || 'error' in body) {
    const code = body && 'code' in body ? body.code : 'upstream_error'
    const message = body && 'error' in body ? body.error : `API /api/ai respondeu ${res.status}`
    throw new AiRequestError(code, message)
  }
  return body
}
