import { describe, expect, it, vi } from 'vitest'
import { buildStateData } from '../../server/src/estado/service.js'
import { buildIndicatorsData } from '../../server/src/municipios/service.js'
import { buildMapData } from '../../server/src/mapa/service.js'
import type { IndicatorDoc, StateValueDoc } from '../../server/src/types/index.js'
import { CAMPINA, agendaIndicator, makeCatalog, stateIndicator } from './fixtures.js'

// O grão estadual é servido por uma coleção própria (`stateValues`) e por uma
// seção de catálogo que o resto do sistema ignora. O que estes testes protegem é
// justamente o que não se vê na tela: que ele NÃO classifica e que NÃO vaza para
// o grão municipal.

const UF = '25'

function stateDoc(
  indicatorId: string,
  referenceYear: string,
  numericValue: number | null,
  extra: Partial<StateValueDoc> = {},
): StateValueDoc {
  return {
    uf: UF,
    indicatorId,
    referenceYear,
    numericValue,
    rawValue: numericValue == null ? '—' : String(numericValue),
    isFictional: false,
    ...extra,
  }
}

describe('estado · payload', () => {
  it('não serve status nem threshold — a ausência é o contrato', () => {
    // Um threshold no catálogo não deve virar cor: se alguém puser régua onde foi
    // medido que ela não informa (7 dos 8 no tercil do meio entre as 27 UFs),
    // este teste é o que avisa.
    const ind = stateIndicator('uf-empregados', {
      threshold: { kind: 'higher-better', success: 10, warning: 5 },
    })
    const data = buildStateData(UF, makeCatalog([ind]), [stateDoc('uf-empregados', '2025', 914955)])

    expect(data.indicators).toHaveLength(1)
    expect(data.indicators[0]).not.toHaveProperty('status')
    expect(data.indicators[0]).not.toHaveProperty('threshold')
  })

  it('escolhe o ano pelo referenceYear do catálogo, não pelo mais recente', () => {
    const ind = stateIndicator('uf-enem-media', { referenceYear: '2023' })
    const data = buildStateData(UF, makeCatalog([ind]), [
      stateDoc('uf-enem-media', '2024', 375),
      stateDoc('uf-enem-media', '2023', 362),
    ])
    expect(data.indicators[0].referenceYear).toBe('2023')
    expect(data.indicators[0].numericValue).toBe(362)
  })

  it('sem referenceViewYear no catálogo, serve o ano mais recente', () => {
    const data = buildStateData(UF, makeCatalog([stateIndicator('uf-populacao')]), [
      stateDoc('uf-populacao', '2023', 4_000_000),
      stateDoc('uf-populacao', '2025', 4_164_468),
      stateDoc('uf-populacao', '2024', 4_100_000),
    ])
    expect(data.indicators[0].referenceYear).toBe('2025')
  })

  it('a série vem completa e do mais antigo ao mais recente', () => {
    const data = buildStateData(UF, makeCatalog([stateIndicator('uf-populacao')]), [
      stateDoc('uf-populacao', '2025', 3),
      stateDoc('uf-populacao', '2023', 1),
      stateDoc('uf-populacao', '2024', 2),
    ])
    expect(data.indicators[0].series.map((p) => p.referenceYear)).toEqual([
      '2023',
      '2024',
      '2025',
    ])
  })

  it('indicador do catálogo sem valor no banco não é servido', () => {
    const data = buildStateData(
      UF,
      makeCatalog([stateIndicator('uf-populacao'), stateIndicator('uf-empregados')]),
      [stateDoc('uf-populacao', '2025', 4_164_468)],
    )
    expect(data.indicators.map((i) => i.id)).toEqual(['uf-populacao'])
  })

  it('o breakdown atravessa inteiro — é onde moram a distribuição e a posição', () => {
    const breakdown = {
      porSetor: { 'Administração Pública': 332043, Serviço: 280575 },
      posicao: { entreUfs: 19, totalUfs: 27, entreNordeste: 4, totalNordeste: 9 },
    }
    const data = buildStateData(UF, makeCatalog([stateIndicator('uf-emprego-setor')]), [
      stateDoc('uf-emprego-setor', '2025', 914955, { breakdown }),
    ])
    expect(data.indicators[0].breakdown).toEqual(breakdown)
  })

  it('numericValue ausente vira null, não zero', () => {
    const data = buildStateData(UF, makeCatalog([stateIndicator('uf-populacao')]), [
      stateDoc('uf-populacao', '2025', null),
    ])
    expect(data.indicators[0].numericValue).toBeNull()
  })

  it('doc de stateValues cujo indicador não é da seção estadual não entra', () => {
    // Proteção contra o caminho inverso do vazamento: um id de agenda que ganhasse
    // um doc em stateValues não deve aparecer na visão estadual.
    const data = buildStateData(UF, makeCatalog([agendaIndicator('idh-m')]), [
      stateDoc('idh-m', '2022', 0.7),
    ])
    expect(data.indicators).toEqual([])
  })

  it('nomeia a UF', () => {
    const data = buildStateData(UF, makeCatalog([stateIndicator('uf-populacao')]), [
      stateDoc('uf-populacao', '2025', 4_164_468),
    ])
    expect(data).toMatchObject({ uf: '25', name: 'Paraíba' })
  })
})

describe('estado · não vaza para o grão municipal', () => {
  // Aqui o catálogo é o REAL (`loadCatalog`), não o fixture: a garantia de não
  // vazamento mora em catalog.ts, e testá-la pelo fixture seria circular.
  async function catalogoReal(indicators: IndicatorDoc[]) {
    vi.resetModules()
    vi.doMock('../../server/src/infra/db.js', () => ({
      getDb: () => ({
        collection: (nome: string) => ({
          find: () => ({
            sort: () => ({ toArray: async () => (nome === 'agendas' ? AGENDAS : indicators) }),
            toArray: async () => (nome === 'agendas' ? AGENDAS : indicators),
          }),
        }),
      }),
    }))
    const { loadCatalog } = await import('../../server/src/indicadores/catalog.js')
    return loadCatalog()
  }
  const AGENDAS = [{ _id: 'ambiente', name: 'Ambiente de negócio', order: 1 }]

  it('a seção estadual não entra em agenda, base econômica nem opções do mapa', async () => {
    const catalog = await catalogoReal([
      stateIndicator('uf-populacao'),
      agendaIndicator('idh-m'),
    ])

    expect(catalog.estadual.map((i) => i._id)).toEqual(['uf-populacao'])
    expect(catalog.socialeconomic).toEqual([])
    expect(catalog.indicatorsByAgenda.get('ambiente')?.map((i) => i._id)).toEqual(['idh-m'])

    // a ficha do município não mostra o indicador estadual...
    const ficha = buildIndicatorsData(CAMPINA, catalog, [])
    const idsDaFicha = [
      ...ficha.agendas.flatMap((a) => a.indicators.map((i) => i.id)),
      ...ficha.economicBase.map((i) => i.id),
    ]
    expect(idsDaFicha).not.toContain('uf-populacao')

    // ...e ele não aparece como opção de coloração do mapa. A opção se identifica
    // por `value` (MapOption não tem `id`) — pelo `id` o teste passaria comparando
    // undefined, sem asseverar nada.
    const mapa = buildMapData(catalog, [CAMPINA], [])
    // asseverado nos dois sentidos: com a lista vazia o `not.toContain` passaria
    // de graça, sem provar exclusão nenhuma.
    expect(mapa.options.map((o) => o.value)).toEqual(['idh-m'])
  })

  it('ordena a seção estadual pela order do placement', async () => {
    const catalog = await catalogoReal([
      stateIndicator('uf-enem-media', {}),
      { _id: 'uf-populacao', label: 'pop', placements: [{ section: 'estadual', order: 0 }] },
    ])
    expect(catalog.estadual.map((i) => i._id)).toEqual(['uf-populacao', 'uf-enem-media'])
  })
})
