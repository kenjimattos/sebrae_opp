import type { Catalog } from './repo.js'
import { computeStatus } from './status.js'
import type {
  EmendaDoc,
  EmendaEsfera,
  EmendaEsferaMeta,
  EmendasData,
  EmendaValores,
  IndicatorDoc,
  IndicatorsData,
  IndicatorValueDoc,
  MapData,
  MapMunicipality,
  MunicipalityDoc,
} from './types.js'

// Monta as respostas da API a partir do catálogo (estrutura) + valores por
// município. Espelha buildIndicators()/buildMunicipalityMapData() do frontend.

// Amostra insuficiente nos tempos da Redesim: são médias/percentis por município;
// com poucos processos (n<30 → confiabilidade 'baixa'; n=0 → 'sem-dados') o valor
// não é representativo — municípios pequenos com 1–2 aberturas geram tempos
// quase-zero enganosos, que o semáforo lower-better ainda pintaria de verde. Por
// decisão do projeto (jun/2026, revisada) esses valores são OCULTADOS: viram '—' /
// status 'none', como os 'sem-dados'.
//
// Escopo restrito a estes indicadores de propósito: outros indicadores também
// marcam confiabilidade 'baixa' (crescimento-mpe, negócios abertos/extintos…), mas
// lá é contagem real de município pequeno, não artefato de média — não se oculta.
const LOW_SAMPLE_HIDDEN = new Set(['tempo-abertura', 'tempo-viabilidade'])

function isLowConfidence(v: IndicatorValueDoc | undefined): boolean {
  if (!v || !LOW_SAMPLE_HIDDEN.has(v.indicatorId)) return false
  const c = v.breakdown?.confiabilidade
  return c === 'baixa' || c === 'sem-dados'
}

// De vários docs do mesmo indicador (série histórica por ano), escolhe o do ano
// de referência default do indicador; na falta, o ano mais recente.
function pickValue(
  docs: IndicatorValueDoc[],
  defaultYear?: string,
): IndicatorValueDoc | undefined {
  if (docs.length === 0) return undefined
  if (defaultYear) {
    const exact = docs.find((d) => d.referenceYear === defaultYear)
    if (exact) return exact
  }
  return docs.reduce((a, b) => (b.referenceYear > a.referenceYear ? b : a))
}

// Indexa os valores de um município por indicatorId, já resolvendo o ano default.
function indexValues(
  values: IndicatorValueDoc[],
  byId: Map<string, IndicatorDoc>,
): Map<string, IndicatorValueDoc> {
  const grouped = new Map<string, IndicatorValueDoc[]>()
  for (const v of values) {
    const list = grouped.get(v.indicatorId) ?? []
    list.push(v)
    grouped.set(v.indicatorId, list)
  }
  const out = new Map<string, IndicatorValueDoc>()
  for (const [indicatorId, docs] of grouped) {
    const picked = pickValue(docs, byId.get(indicatorId)?.referenceYear)
    if (picked) out.set(indicatorId, picked)
  }
  return out
}

export function buildIndicatorsData(
  municipality: MunicipalityDoc,
  catalog: Catalog,
  values: IndicatorValueDoc[],
): IndicatorsData {
  const byIndicator = indexValues(values, catalog.byId)

  const agendas = catalog.agendas.map((a) => ({
    id: a._id,
    name: a.name,
    indicators: (catalog.indicatorsByAgenda.get(a._id) ?? []).map((ind) => {
      const v = byIndicator.get(ind._id)
      const suppressed = isLowConfidence(v)
      return {
        id: ind._id,
        label: ind.label,
        value: suppressed ? '—' : v?.rawValue ?? '—',
        // O número vai junto do texto: o frontend precisa dele para posicionar o
        // marcador da IndicatorBar, e reconstruí-lo do `value` custaria a mesma
        // precisão que o semáforo já perdia.
        numericValue: suppressed ? null : v?.numericValue ?? null,
        variation: suppressed ? undefined : v?.variation,
        status: suppressed ? 'none' : computeStatus(ind.threshold, v),
        // threshold vai pro frontend derivar os rótulos das zonas da barra
        // (só existe nos indicadores com faixa oficial).
        threshold: ind.threshold,
      }
    }),
  }))

  const economicBase = catalog.socialeconomic.map((ind) => {
    const v = byIndicator.get(ind._id)
    return {
      id: ind._id,
      label: ind.label,
      value: v?.rawValue ?? '—',
      variation: v?.variation ?? '',
      referenceYear: v?.referenceYear ?? ind.referenceYear ?? '',
    }
  })

  return { municipality: municipality.name, agendas, economicBase }
}

export function buildMapData(
  catalog: Catalog,
  municipalities: MunicipalityDoc[],
  allValues: IndicatorValueDoc[],
): MapData {
  // Opções do dropdown = todos os indicadores de agenda (mesma regra do
  // indicatorOptions do frontend).
  const agendaIndicators = catalog.agendas.flatMap(
    (a) => catalog.indicatorsByAgenda.get(a._id) ?? [],
  )
  const options = agendaIndicators.map((ind) => ({
    label: ind.label,
    shortLabel: ind.label,
    value: ind._id,
  }))
  const agendaIndicatorIds = new Set(agendaIndicators.map((i) => i._id))

  // Agrupa valores por município.
  const valuesByMunicipality = new Map<string, IndicatorValueDoc[]>()
  for (const v of allValues) {
    const list = valuesByMunicipality.get(v.municipalityId) ?? []
    list.push(v)
    valuesByMunicipality.set(v.municipalityId, list)
  }

  const out: Record<string, MapMunicipality> = {}
  for (const m of municipalities) {
    const byIndicator = indexValues(valuesByMunicipality.get(m._id) ?? [], catalog.byId)
    const indicators: MapMunicipality['indicators'] = {}
    for (const [indicatorId, v] of byIndicator) {
      if (!agendaIndicatorIds.has(indicatorId)) continue
      if (isLowConfidence(v)) continue
      const n = v.numericValue
      if (typeof n !== 'number' || !Number.isFinite(n)) continue
      indicators[indicatorId] = {
        value: v.rawValue,
        numericValue: n,
        status: computeStatus(catalog.byId.get(indicatorId)?.threshold, v),
      }
    }
    out[m._id] = { name: m.name, indicators }
  }

  return { options, municipalities: out }
}

// --- Emendas parlamentares (GET /api/emendas) ---

const ESFERAS: EmendaEsfera[] = ['federal', 'estadual']

// A esfera estadual carrega `valor` (o aprovado, publicado à parte da execução);
// a federal não — lá a origem só publica empenhado/pago.
const TEM_VALOR: Record<EmendaEsfera, boolean> = { federal: false, estadual: true }

function toValores(doc: EmendaDoc, esfera: EmendaEsfera): EmendaValores {
  const out: EmendaValores = {
    empenhado: doc.empenhado,
    pago: doc.pago,
    porAno: doc.porAno ?? {},
    nEmendas: doc.nEmendas ?? 0,
    nAutores: doc.nAutores ?? 0,
  }
  if (TEM_VALOR[esfera]) out.valor = doc.valor ?? 0
  return out
}

// Zero no ESTADUAL não é zero real: o município da emenda é inferido do texto
// livre do objeto (`atribuicao: 'texto-beneficiario'`) e ~38% do valor do estado
// não se atribui a ninguém. Um doc todo zerado significa "não conseguimos
// atribuir", não "não recebeu" — então vira `null`, que é o que o contrato
// reserva para "não medimos". No FEDERAL o oposto: lá a origem é censo de
// documentos com código IBGE, e zero é zero de verdade — fica 0.
function semAtribuicaoEstadual(doc: EmendaDoc): boolean {
  return !doc.valor && !doc.empenhado && !doc.pago
}

export function buildEmendasData(
  municipalities: MunicipalityDoc[],
  docs: EmendaDoc[],
): EmendasData {
  // Indexa por esfera: 223 docs municipais + 1 rollup do estado.
  const porMunicipio = new Map<string, EmendaDoc>() // `${ibge}:${esfera}`
  const porEstado = new Map<EmendaEsfera, EmendaDoc>()
  for (const d of docs) {
    if (d.escopo === 'estado') porEstado.set(d.esfera, d)
    else if (d.municipalityId) porMunicipio.set(`${d.municipalityId}:${d.esfera}`, d)
  }

  const esferas = {} as Record<EmendaEsfera, EmendaEsferaMeta>
  for (const esfera of ESFERAS) {
    const est = porEstado.get(esfera)
    if (!est) continue

    // Cobertura municipal = fração do total do estado que foi atribuída a algum
    // município. A base difere por esfera de propósito: no federal a atribuição é
    // exata (código IBGE) e o que interessa é quanto do dinheiro EXECUTADO caiu em
    // município, então mede-se sobre `pago`; no estadual o que se atribui a partir
    // do texto é a emenda inteira, e a origem publica o valor aprovado — medir
    // sobre `pago` subestimaria emendas ainda não executadas.
    const base = TEM_VALOR[esfera] ? 'valor' : 'pago'
    const totalEstado = (base === 'valor' ? est.valor : est.pago) ?? 0
    const naoMun = est.naoMunicipalizado
    const foraMunicipio = (base === 'valor' ? naoMun?.valor : naoMun?.pago) ?? 0
    const coberturaMunicipal = totalEstado
      ? Math.round(((totalEstado - foraMunicipio) / totalEstado) * 10000) / 10000
      : 0

    esferas[esfera] = {
      janela: est.janela ?? { de: 0, ate: 0 },
      atribuicao: est.atribuicao ?? (esfera === 'federal' ? 'ibge' : 'texto-beneficiario'),
      criterioQuebraAnual: est.criterioQuebraAnual ?? '',
      source: est.source ?? '',
      coletadoEm: est.coletadoEm ?? '',
      estado: {
        ...toValores(est, esfera),
        // Monta explicitamente em vez de repassar o doc: o federal grava um
        // `porAno` aqui que o contrato não declara, e a rota não deve vazar
        // campos fora dele.
        naoMunicipalizado: {
          ...(TEM_VALOR[esfera] ? { valor: naoMun?.valor ?? 0 } : {}),
          empenhado: naoMun?.empenhado ?? 0,
          pago: naoMun?.pago ?? 0,
          nota: naoMun?.nota ?? '',
        },
      },
      coberturaMunicipal,
    }
  }

  // Sempre os 223, na ordem canônica do projeto = código IBGE (a mesma de
  // database/seed/municipios.mongodb.js). Ordena aqui em vez de confiar no sort do
  // Mongo: o default é binário sobre os bytes UTF-8, que jogaria os nomes
  // acentuados ("Água Branca") para depois do Z. Por IBGE a lista sai
  // alfabética de fato, exceto nos municípios renomeados — São João do Rio do
  // Peixe (2500700) fica onde estava Antenor Navarro. A UI acessa por id, mas o
  // contrato promete a ordem.
  const ordenados = [...municipalities].sort((a, b) => a._id.localeCompare(b._id))
  const municipios = ordenados.map((m) => {
    const federal = porMunicipio.get(`${m._id}:federal`)
    const estadual = porMunicipio.get(`${m._id}:estadual`)
    return {
      id: m._id,
      name: m.name,
      federal: federal ? toValores(federal, 'federal') : null,
      estadual: estadual && !semAtribuicaoEstadual(estadual)
        ? toValores(estadual, 'estadual')
        : null,
    }
  })

  return { esferas, municipios }
}
