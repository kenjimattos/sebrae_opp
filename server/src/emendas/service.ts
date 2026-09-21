import type {
  EmendaDoc,
  EmendaEsfera,
  EmendaEsferaMeta,
  EmendasData,
  EmendaValores,
  MunicipalityDoc,
} from '../types/index.js'

// Monta GET /api/emendas (modo "Mapeamento de recursos"). As duas esferas saem
// juntas: o mapa colore o estado inteiro e o toggle federal/estadual não deve
// disparar nova requisição.

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
