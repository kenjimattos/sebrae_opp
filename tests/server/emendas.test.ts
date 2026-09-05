import { describe, expect, it } from 'vitest'
import { buildEmendasData } from '../../server/src/services.js'
import type { EmendaDoc, MunicipalityDoc } from '../../server/src/types.js'

// A cobertura municipal é decisão metodológica que vira número publicado: no
// FEDERAL mede-se sobre `pago` (atribuição exata por código IBGE, interessa o
// executado); no ESTADUAL sobre `valor` (atribui-se a emenda inteira a partir do
// texto, e medir por `pago` subestimaria as não executadas). Trocar a base não
// quebra nada — só publica outro número. Os fixtures abaixo escolhem valores em
// que cada base dá resultado diferente, para a troca aparecer como falha.

const CAMPINA: MunicipalityDoc = { _id: '2504009', name: 'Campina Grande', slug: 'campina-grande' }
const JOAO_PESSOA: MunicipalityDoc = { _id: '2507507', name: 'João Pessoa', slug: 'joao-pessoa' }

function estadoDoc(doc: Partial<EmendaDoc> & Pick<EmendaDoc, 'esfera'>): EmendaDoc {
  return {
    _id: `PB:${doc.esfera}`,
    escopo: 'estado',
    empenhado: 0,
    pago: 0,
    referenceYear: '2024',
    isFictional: false,
    ...doc,
  }
}

function municipioDoc(doc: Partial<EmendaDoc> & Pick<EmendaDoc, 'esfera' | 'municipalityId'>): EmendaDoc {
  return {
    _id: `${doc.municipalityId}:${doc.esfera}`,
    escopo: 'municipio',
    empenhado: 0,
    pago: 0,
    referenceYear: '2024',
    isFictional: false,
    ...doc,
  }
}

// Federal: pago 1000, fora 400 → 0,6. Empenhado daria 0,9; `valor` não existe
// na esfera e daria 0. Estadual: valor 2000, fora 800 → 0,6; `pago` daria 0,8.
const FEDERAL_ESTADO = estadoDoc({
  esfera: 'federal',
  empenhado: 900,
  pago: 1000,
  naoMunicipalizado: { empenhado: 90, pago: 400, nota: 'consórcios e entidades' },
})

const ESTADUAL_ESTADO = estadoDoc({
  esfera: 'estadual',
  valor: 2000,
  empenhado: 700,
  pago: 500,
  naoMunicipalizado: { valor: 800, empenhado: 200, pago: 100, nota: 'não atribuído' },
})

describe('buildEmendasData · cobertura municipal', () => {
  it('o federal mede sobre pago, não sobre empenhado nem valor', () => {
    const { esferas } = buildEmendasData([CAMPINA], [FEDERAL_ESTADO])
    expect(esferas.federal.coberturaMunicipal).toBe(0.6)
  })

  it('o estadual mede sobre valor, não sobre pago', () => {
    const { esferas } = buildEmendasData([CAMPINA], [ESTADUAL_ESTADO])
    expect(esferas.estadual.coberturaMunicipal).toBe(0.6)
    // A base errada daria 0,8 — a fração do EXECUTADO, que subestima o que a
    // esfera atribui, porque a origem publica o aprovado à parte da execução.
    expect(esferas.estadual.coberturaMunicipal).not.toBe(0.8)
  })

  it('as duas esferas convivem no mesmo payload, cada uma com sua base', () => {
    const { esferas } = buildEmendasData([CAMPINA], [FEDERAL_ESTADO, ESTADUAL_ESTADO])
    expect(esferas.federal.coberturaMunicipal).toBe(0.6)
    expect(esferas.estadual.coberturaMunicipal).toBe(0.6)
  })

  it('total do estado zerado devolve 0, sem NaN nem divisão por zero', () => {
    const { esferas } = buildEmendasData(
      [CAMPINA],
      [estadoDoc({ esfera: 'federal', empenhado: 0, pago: 0 })],
    )
    expect(esferas.federal.coberturaMunicipal).toBe(0)
    expect(Number.isNaN(esferas.federal.coberturaMunicipal)).toBe(false)
  })

  it('arredonda em 4 casas', () => {
    const { esferas } = buildEmendasData(
      [CAMPINA],
      [estadoDoc({
        esfera: 'federal',
        pago: 3,
        empenhado: 3,
        naoMunicipalizado: { empenhado: 1, pago: 1, nota: '' },
      })],
    )
    expect(esferas.federal.coberturaMunicipal).toBe(0.6667)
  })

  it('sem naoMunicipalizado, tudo caiu em município: cobertura 1', () => {
    const { esferas } = buildEmendasData(
      [CAMPINA],
      [estadoDoc({ esfera: 'federal', empenhado: 900, pago: 1000 })],
    )
    expect(esferas.federal.coberturaMunicipal).toBe(1)
    expect(esferas.federal.estado.naoMunicipalizado).toEqual({ empenhado: 0, pago: 0, nota: '' })
  })

  it('esfera sem documento de estado é pulada, não quebra', () => {
    const { esferas, municipios } = buildEmendasData([CAMPINA], [ESTADUAL_ESTADO])
    expect(esferas.estadual).toBeDefined()
    expect(esferas.federal).toBeUndefined()
    expect(municipios).toHaveLength(1)
  })
})

describe('buildEmendasData · o campo valor existe só no estadual', () => {
  it('o federal não emite valor, nem no estado nem no naoMunicipalizado', () => {
    const { esferas } = buildEmendasData([CAMPINA], [FEDERAL_ESTADO])
    expect('valor' in esferas.federal.estado).toBe(false)
    expect('valor' in esferas.federal.estado.naoMunicipalizado).toBe(false)
  })

  it('o estadual emite valor nos dois', () => {
    const { esferas } = buildEmendasData([CAMPINA], [ESTADUAL_ESTADO])
    expect(esferas.estadual.estado.valor).toBe(2000)
    expect(esferas.estadual.estado.naoMunicipalizado.valor).toBe(800)
  })

  it('o federal não vaza o porAno do doc de estado para fora do contrato', () => {
    const doc = estadoDoc({
      esfera: 'federal',
      empenhado: 900,
      pago: 1000,
      porAno: { '2024': { empenhado: 900, pago: 1000 } },
    })
    const { esferas } = buildEmendasData([CAMPINA], [doc])
    // porAno é declarado em EmendaValores, então segue; o que não pode é
    // aparecer dentro de naoMunicipalizado, montado campo a campo.
    expect(Object.keys(esferas.federal.estado.naoMunicipalizado).sort()).toEqual([
      'empenhado', 'nota', 'pago',
    ])
  })
})

describe('buildEmendasData · zero por esfera', () => {
  it('estadual todo zerado vira null: é "não atribuímos", não "não recebeu"', () => {
    const { municipios } = buildEmendasData(
      [CAMPINA],
      [ESTADUAL_ESTADO, municipioDoc({ esfera: 'estadual', municipalityId: '2504009', valor: 0, empenhado: 0, pago: 0 })],
    )
    expect(municipios[0]!.estadual).toBeNull()
  })

  it('federal zerado continua 0: lá é censo por código IBGE, zero é zero', () => {
    const { municipios } = buildEmendasData(
      [CAMPINA],
      [FEDERAL_ESTADO, municipioDoc({ esfera: 'federal', municipalityId: '2504009', empenhado: 0, pago: 0 })],
    )
    expect(municipios[0]!.federal).not.toBeNull()
    expect(municipios[0]!.federal!.pago).toBe(0)
  })

  it('estadual com qualquer valor não-zero é mantido', () => {
    const { municipios } = buildEmendasData(
      [CAMPINA],
      [ESTADUAL_ESTADO, municipioDoc({ esfera: 'estadual', municipalityId: '2504009', valor: 0, empenhado: 0, pago: 12 })],
    )
    expect(municipios[0]!.estadual!.pago).toBe(12)
  })

  it('município sem documento de uma esfera vem null naquela esfera', () => {
    const { municipios } = buildEmendasData(
      [CAMPINA],
      [FEDERAL_ESTADO, municipioDoc({ esfera: 'federal', municipalityId: '2504009', empenhado: 5, pago: 5 })],
    )
    expect(municipios[0]!.federal).not.toBeNull()
    expect(municipios[0]!.estadual).toBeNull()
  })
})

describe('buildEmendasData · a lista de municípios', () => {
  it('sai na ordem canônica do código IBGE, não na ordem de entrada', () => {
    const { municipios } = buildEmendasData([JOAO_PESSOA, CAMPINA], [FEDERAL_ESTADO])
    expect(municipios.map((m) => m.id)).toEqual(['2504009', '2507507'])
  })

  it('devolve todos os municípios recebidos, mesmo sem nenhuma emenda', () => {
    const { municipios } = buildEmendasData([CAMPINA, JOAO_PESSOA], [FEDERAL_ESTADO])
    expect(municipios).toHaveLength(2)
    expect(municipios.every((m) => m.federal === null && m.estadual === null)).toBe(true)
  })

  it('doc municipal sem municipalityId é ignorado, não vira entrada solta', () => {
    const orfao: EmendaDoc = {
      _id: 'orfao:federal', escopo: 'municipio', esfera: 'federal',
      municipalityId: null, empenhado: 9, pago: 9, referenceYear: '2024', isFictional: false,
    }
    const { municipios } = buildEmendasData([CAMPINA], [FEDERAL_ESTADO, orfao])
    expect(municipios).toHaveLength(1)
    expect(municipios[0]!.federal).toBeNull()
  })
})

describe('buildEmendasData · metadados da esfera', () => {
  it('repassa janela, atribuição, fonte e critério do doc de estado', () => {
    const doc = estadoDoc({
      esfera: 'estadual',
      valor: 100,
      janela: { de: 2020, ate: 2024 },
      atribuicao: 'texto-beneficiario',
      criterioQuebraAnual: 'safra da emenda',
      source: 'CODATA/CGE-PB',
      coletadoEm: '2026-08-01',
    })
    const { esferas } = buildEmendasData([CAMPINA], [doc])
    expect(esferas.estadual.janela).toEqual({ de: 2020, ate: 2024 })
    expect(esferas.estadual.atribuicao).toBe('texto-beneficiario')
    expect(esferas.estadual.criterioQuebraAnual).toBe('safra da emenda')
    expect(esferas.estadual.source).toBe('CODATA/CGE-PB')
    expect(esferas.estadual.coletadoEm).toBe('2026-08-01')
  })

  it('sem atribuição no doc, cada esfera cai no seu default', () => {
    const { esferas } = buildEmendasData([CAMPINA], [FEDERAL_ESTADO, ESTADUAL_ESTADO])
    expect(esferas.federal.atribuicao).toBe('ibge')
    expect(esferas.estadual.atribuicao).toBe('texto-beneficiario')
  })
})
