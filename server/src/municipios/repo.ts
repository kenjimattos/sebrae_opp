import { getDb } from '../infra/db.js'
import type { IndicatorValueDoc, MunicipalityDoc } from '../types/index.js'

// Acesso ao Mongo para municípios e seus valores de indicador. Só queries — a
// transformação em resposta da API fica em `service.ts`.

export async function listMunicipalities(): Promise<MunicipalityDoc[]> {
  return getDb()
    .collection<MunicipalityDoc>('municipalities')
    .find()
    .sort({ name: 1 })
    .toArray()
}

export async function getMunicipality(id: string): Promise<MunicipalityDoc | null> {
  return getDb().collection<MunicipalityDoc>('municipalities').findOne({ _id: id })
}

export async function getValuesForMunicipality(id: string): Promise<IndicatorValueDoc[]> {
  return getDb()
    .collection<IndicatorValueDoc>('indicatorValues')
    .find({ municipalityId: id })
    .toArray()
}

// Coleção inteira: todos os municípios × todos os indicadores × toda a série.
// É a leitura mais cara da API e existe para uma coisa só — colorir o mapa, que
// precisa dos 223 de uma vez. Chamar sem o cache de `/api/map` na frente
// (infra/payload-cache.ts) põe essa varredura por visitante.
export async function getAllValues(): Promise<IndicatorValueDoc[]> {
  return getDb().collection<IndicatorValueDoc>('indicatorValues').find().toArray()
}
