export const DATAPEDIA_URL =
  'https://datapedia.info/sebrae/conexao/po5aavozprm7z6+-ppswzktavzqb1p3k/ta6dedoanvp1a5d96p6hv9dq77dp64ia'

export interface ResourceCardData {
  title: string
  value: string
}

export const resourceCards: ResourceCardData[] = [
  { title: 'Total empenhado até o momento', value: 'R$ 4,1 bilhões' },
  { title: 'Total pago até o momento', value: 'R$ 3,3 bilhões' },
  { title: 'Pago em 2023', value: 'R$ 649,2 milhões' },
  { title: 'Pago em 2024', value: 'R$ 1,2 bilhões' },
  { title: 'Pago em 2025', value: 'R$ 1,4 bilhões' },
]

export const recursosContent = {
  emendas: {
    title: 'Emendas federais e estaduais mapeadas',
    description: 'Recursos destinados por deputados federais e senadores que podem financiar projetos estruturantes no município.',
    footnote: 'Recursos federais representam uma das principais fontes de financiamento para projetos estruturantes nos municípios.',
  },
  distribuicao: {
    title: 'Distribuição territorial das emendas',
    description: 'Veja como os recursos federais estão distribuídos entre os municípios do estado.',
    mapAlt: 'Mapa de distribuição territorial das emendas — Datapedia',
    overlayLabel: 'Abrir no Datapedia →',
  },
  editais: {
    title: 'Editais e programas de financiamento',
    description: 'Programas federais, estaduais e institucionais com recursos disponíveis para desenvolvimento econômico, inovação e fortalecimento de pequenos negócios.',
  },
  buttons: {
    explorarEmendas: 'Explorar oportunidades de emendas',
    verOportunidades: 'Ver oportunidades',
  },
} as const
