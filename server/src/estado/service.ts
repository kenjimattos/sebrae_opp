import type { Catalog } from '../indicadores/catalog.js'
import { pickByYear } from '../indicadores/values.js'
import type { StateData, StateIndicator, StateSeriesPoint, StateValueDoc } from '../types/index.js'

// Monta o payload da visão estadual a partir do catálogo (seção 'estadual') e de
// `stateValues`. Indicador do catálogo sem nenhum valor no banco simplesmente não
// é retornado — mesma regra do grão municipal.

// O projeto é da Paraíba: uma UF só, e o nome não justifica uma coleção nem uma
// ida ao banco. Se um dia servir outra UF, isto vira consulta — e o `uf` já
// atravessa repo, chave e payload justamente para isso não ser refatoração.
const UF_NAMES: Record<string, string> = { '25': 'Paraíba' }

// A UF que a plataforma serve. Constante, e não parâmetro de rota, porque não há
// dado de outra UF no banco — rota parametrizada convidaria a um 404 por UF que
// nunca vai existir. Fica nomeada para o dia em que virar parâmetro.
export const UF_PADRAO = '25'

// NÃO calcula status, e a ausência é deliberada: nenhum indicador estadual tem
// `threshold`. Por isso este serviço não importa `status.ts` — se um dia importar,
// é sinal de que alguém pôs régua onde foi medido que ela não informa. Ver o
// comentário de `StateIndicator` em types/api.ts.
export function buildStateData(
  uf: string,
  catalog: Catalog,
  values: StateValueDoc[],
): StateData {
  const byIndicator = new Map<string, StateValueDoc[]>()
  for (const v of values) {
    const list = byIndicator.get(v.indicatorId) ?? []
    list.push(v)
    byIndicator.set(v.indicatorId, list)
  }

  const indicators: StateIndicator[] = []
  for (const ind of catalog.estadual) {
    const docs = byIndicator.get(ind._id)
    if (!docs || docs.length === 0) continue

    // Mesma regra de ano do grão municipal, do mesmo lugar (`pickByYear`): o ano
    // default do catálogo se existir, senão o mais recente.
    const picked = pickByYear(docs, ind.referenceYear)
    if (!picked) continue

    const series: StateSeriesPoint[] = docs
      .map((d) => ({
        referenceYear: d.referenceYear,
        value: d.rawValue,
        numericValue: d.numericValue ?? null,
      }))
      .sort((a, b) => a.referenceYear.localeCompare(b.referenceYear))

    indicators.push({
      id: ind._id,
      label: ind.label,
      ...(ind.unit ? { unit: ind.unit } : {}),
      ...(ind.description ? { description: ind.description } : {}),
      ...(ind.source ? { source: ind.source } : {}),
      value: picked.rawValue,
      numericValue: picked.numericValue ?? null,
      ...(picked.variation ? { variation: picked.variation } : {}),
      referenceYear: picked.referenceYear,
      ...(picked.breakdown ? { breakdown: picked.breakdown } : {}),
      series,
    })
  }

  return { uf, name: UF_NAMES[uf] ?? uf, indicators }
}
