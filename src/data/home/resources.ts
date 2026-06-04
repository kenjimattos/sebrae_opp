export const DATAPEDIA_URL =
  'https://datapedia.info/sebrae/conexao/po5aavozprm7z6+-ppswzktavzqb1p3k/ta6dedoanvp1a5d96p6hv9dq77dp64ia'

export interface ResourceCardData {
  title: string
  value: string
}

export const resourceCards: ResourceCardData[] = [
  { title: 'Total empenhado até o momento', value: 'R$ 4,1 bi' },
  { title: 'Total pago até o momento', value: 'R$ 3,3 bi' },
  { title: 'Pago em 2023', value: 'R$ 649,2 mi' },
  { title: 'Pago em 2024', value: 'R$ 1,2 bi' },
  { title: 'Pago em 2025', value: 'R$ 1,4 bi' },
]

export const resourcesContent = {
  emendas: {
    title: 'Emendas federais e estaduais mapeadas',
    description: 'Recursos destinados por deputados federais e senadores que podem financiar projetos estruturantes no município.',
    tableTitle: 'Histórico de Valores pagos e empenhados até o momento',
    footnote: 'Recursos federais representam uma das principais fontes de financiamento para projetos estruturantes nos municípios.',
  },
  distribuicao: {
    description: 'Veja como os recursos federais estão distribuídos entre os municípios do estado.',
    mapAlt: 'Mapa de distribuição territorial das emendas — Datapedia',
    overlayLabel: 'Explorar emendas',
  },
  editais: {
    title: 'Editais e programas de financiamento',
    description: 'Programas federais, estaduais e institucionais com recursos disponíveis para desenvolvimento econômico, inovação e fortalecimento de pequenos negócios.',
  },
  buttons: {
    explorarEmendas: 'Explorar emendas',
    verOportunidades: 'Ver oportunidades',
  },
} as const
