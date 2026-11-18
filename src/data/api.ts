// Client da API de leitura (server/). Em dev o Vite faz proxy de /api → :3000;
// em produção o Nginx faz o mesmo. Substitui os imports estáticos de
// municipalities.json e values/*.ts.
import { authFetch } from '@/data/http'
import type { EmendasData } from '@/types/emendas'
import type { StateData } from '@/types/estado'
import type { TermsAcceptance } from '@/types/terms'
import type { IndicatorsData } from '@/types/indicators'

export interface MunicipalitySummary {
  id: string
  name: string
  slug: string
}

const BASE = '/api'

// Lê o corpo como JSON ou explica por que não deu. O firewall (WAF) do Sebrae barra o
// pedido com status 200 e uma página HTML "Request Rejeitado": sem esta checagem o
// `res.json()` falha com "Unexpected token '<'" e a tela só diz que deu erro. O
// "código de suporte" da página é o que a TI usa para achar o motivo no log do WAF.
async function readJSON<T>(res: Response, path: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`API ${path} respondeu ${res.status}`)
  }
  const type = (res.headers.get('content-type') ?? '').split(';')[0]?.trim() ?? ''
  if (!type.includes('json')) {
    const body = await res.text().catch(() => '')
    const code = /suporte:\s*(\d{8,})/.exec(body)?.[1]
    throw new Error(
      `API ${path} devolveu ${type || 'uma resposta sem tipo'} em vez de JSON` +
        (code ? ` (código de suporte ${code})` : '') +
        ' — provável bloqueio do firewall (WAF) ou de um proxy',
    )
  }
  return (await res.json()) as T
}

async function getJSON<T>(path: string): Promise<T> {
  return readJSON<T>(await authFetch(`${BASE}${path}`), path)
}

// Lista de municípios (seletor). GET /api/municipalities
export function fetchMunicipalities(): Promise<MunicipalitySummary[]> {
  return getJSON<MunicipalitySummary[]>('/municipalities')
}

// Dados completos de um município (agendas + base econômica, status já
// calculado no servidor). GET /api/municipalities/:id
export function fetchMunicipalityData(id: string): Promise<IndicatorsData> {
  return getJSON<IndicatorsData>(`/municipalities/${encodeURIComponent(id)}`)
}

// Emendas parlamentares (federais + estaduais) dos 223 municípios, num payload
// só — o modo "Mapeamento de recursos" precisa de todos de uma vez para colorir
// o mapa, e o conjunto é pequeno. GET /api/emendas
export function fetchEmendas(): Promise<EmendasData> {
  return getJSON<EmendasData>('/emendas')
}

// Indicadores da Paraíba no grão estadual, com série histórica. Payload único —
// a visão estadual mostra os 8 juntos. Nenhum deles classifica: não há `status`
// nem `threshold` no contrato, e a ausência é deliberada (ver @/types/estado).
// GET /api/estado
export function fetchStateData(): Promise<StateData> {
  return getJSON<StateData>('/estado')
}

// Aceite dos termos de uso do usuário logado. GET /api/terms/acceptance
export function fetchTermsAcceptance(): Promise<TermsAcceptance> {
  return getJSON<TermsAcceptance>('/terms/acceptance')
}

// Grava o aceite da versão que a tela mostrou (o servidor recusa outra).
// POST /api/terms/acceptance
export async function postTermsAcceptance(version: string): Promise<TermsAcceptance> {
  const res = await authFetch(`${BASE}/terms/acceptance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version }),
  })
  return readJSON<TermsAcceptance>(res, '/terms/acceptance')
}
