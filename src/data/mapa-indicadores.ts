// Indicadores por município para coloração do mapa
// Chave: código IBGE do município
// Indicadores alinham com as agendas do município

import type { StatusType } from '@/types/indicadores'

export const indicadorOptions = [
  // Governança
  { label: 'IGM – Índice CFA de Governança Municipal (Finanças, Gestão e Desempenho) 2025', shortLabel: 'Governança Municipal', value: 'governanca_cfa' },
  { label: 'IDH-M 2021', shortLabel: 'IDH-M', value: 'idhm' },
  { label: 'Governança para o Desenvolvimento – ISDEL 2023', shortLabel: 'ISDEL', value: 'isdel' },
  // Simplificação
  { label: 'Tempo médio de abertura da empresa (h)', shortLabel: 'Abertura de empresa', value: 'tempo_abertura' },
  { label: 'Tempo médio de viabilidade da empresa (h) em relação à média estadual', shortLabel: 'Viabilidade de empresa', value: 'tempo_viabilidade' },
  { label: 'Ranking municipal Redesim/PB', shortLabel: 'Ranking Redesim', value: 'ranking_redesim' },
  { label: 'Tempo de licenciamento', shortLabel: 'Licenciamento', value: 'tempo_licenciamento' },
  // Inovação
  { label: 'Trabalhadores nas ocupações de C&T', shortLabel: 'Trabalhadores C&T', value: 'trabalhadores_ct' },
  { label: 'Trabalhadores nos setores da economia criativa, inovação e TIC', shortLabel: 'Economia criativa/TIC', value: 'trabalhadores_tic' },
  // Educação empreendedora
  { label: 'Subdimensão Educação Empreendedora, da dimensão Capital Empreendedor – ISDEL', shortLabel: 'Educação Empreendedora', value: 'educacao_isdel' },
  { label: 'Trabalhadores formais com pelo menos o Ensino Médio Completo', shortLabel: 'Ensino Médio', value: 'ensino_medio' },
  { label: 'Trabalhadores formais com pelo menos o Ensino Superior Completo', shortLabel: 'Ensino Superior', value: 'ensino_superior' },
  // Inclusão produtiva
  { label: 'Total de pequenos negócios abertos', shortLabel: 'Negócios abertos', value: 'negocios_abertos' },
  { label: 'Total de pequenos negócios extintos no período', shortLabel: 'Negócios extintos', value: 'negocios_extintos' },
] as const

export type IndicadorKey = (typeof indicadorOptions)[number]['value']

// Mapeamento de label da agenda → value do indicador
export const labelToKey: Record<string, IndicadorKey> = {}
for (const opt of indicadorOptions) {
  labelToKey[opt.label] = opt.value
}

interface MapIndicadorEntry {
  valor: string
  valorNumerico?: number
  status: StatusType
}

interface MunicipioMapData {
  nome: string
  indicadores: Partial<Record<IndicadorKey, MapIndicadorEntry>>
}

export const municipiosMapData: Record<string, MunicipioMapData> = {
  '2507507': {
    nome: 'João Pessoa',
    indicadores: {
      governanca_cfa: { valor: '7,8', valorNumerico: 7.8, status: 'success' },
      idhm: { valor: '0,763', valorNumerico: 0.763, status: 'success' },
      isdel: { valor: '0,62', valorNumerico: 0.62, status: 'success' },
      tempo_abertura: { valor: '12h', valorNumerico: 12, status: 'success' },
      tempo_viabilidade: { valor: '15 dias', valorNumerico: 15, status: 'success' },
      ranking_redesim: { valor: 'Completo', status: 'success' },
      tempo_licenciamento: { valor: '10 dias', valorNumerico: 10, status: 'success' },
      trabalhadores_ct: { valor: '4.850', valorNumerico: 4850, status: 'success' },
      trabalhadores_tic: { valor: '5,1%', valorNumerico: 5.1, status: 'success' },
      educacao_isdel: { valor: '22 escolas', valorNumerico: 22, status: 'success' },
      ensino_medio: { valor: '78%', valorNumerico: 78, status: 'success' },
      ensino_superior: { valor: '28%', valorNumerico: 28, status: 'warning' },
      negocios_abertos: { valor: '3.820', valorNumerico: 3820, status: 'success' },
      negocios_extintos: { valor: '1.950', valorNumerico: 1950, status: 'warning' },
    },
  },
  '2504009': {
    nome: 'Campina Grande',
    indicadores: {
      governanca_cfa: { valor: '6,2', valorNumerico: 6.2, status: 'warning' },
      idhm: { valor: '0,720', valorNumerico: 0.72, status: 'success' },
      isdel: { valor: '0,48', valorNumerico: 0.48, status: 'alert' },
      tempo_abertura: { valor: '18h', valorNumerico: 18, status: 'success' },
      tempo_viabilidade: { valor: '22 dias', valorNumerico: 22, status: 'warning' },
      ranking_redesim: { valor: 'Parcial', status: 'warning' },
      tempo_licenciamento: { valor: '15 dias', valorNumerico: 15, status: 'warning' },
      trabalhadores_ct: { valor: '1.420', valorNumerico: 1420, status: 'success' },
      trabalhadores_tic: { valor: '3,2%', valorNumerico: 3.2, status: 'warning' },
      educacao_isdel: { valor: '8 escolas', valorNumerico: 8, status: 'warning' },
      ensino_medio: { valor: '72%', valorNumerico: 72, status: 'success' },
      ensino_superior: { valor: '18%', valorNumerico: 18, status: 'alert' },
      negocios_abertos: { valor: '1.240', valorNumerico: 1240, status: 'success' },
      negocios_extintos: { valor: '890', valorNumerico: 890, status: 'warning' },
    },
  },
  '2510808': {
    nome: 'Patos',
    indicadores: {
      governanca_cfa: { valor: '4,5', valorNumerico: 4.5, status: 'alert' },
      idhm: { valor: '0,701', valorNumerico: 0.701, status: 'warning' },
      isdel: { valor: '0,35', valorNumerico: 0.35, status: 'alert' },
      tempo_abertura: { valor: '28h', valorNumerico: 28, status: 'warning' },
      tempo_viabilidade: { valor: '35 dias', valorNumerico: 35, status: 'alert' },
      ranking_redesim: { valor: 'Não aderiu', status: 'alert' },
      tempo_licenciamento: { valor: '25 dias', valorNumerico: 25, status: 'alert' },
      trabalhadores_ct: { valor: '380', valorNumerico: 380, status: 'warning' },
      trabalhadores_tic: { valor: '1,2%', valorNumerico: 1.2, status: 'alert' },
      educacao_isdel: { valor: '3 escolas', valorNumerico: 3, status: 'alert' },
      ensino_medio: { valor: '65%', valorNumerico: 65, status: 'warning' },
      ensino_superior: { valor: '12%', valorNumerico: 12, status: 'alert' },
      negocios_abertos: { valor: '520', valorNumerico: 520, status: 'warning' },
      negocios_extintos: { valor: '480', valorNumerico: 480, status: 'alert' },
    },
  },
  '2501302': {
    nome: 'Bayeux',
    indicadores: {
      governanca_cfa: { valor: '5,1', valorNumerico: 5.1, status: 'warning' },
      idhm: { valor: '0,649', valorNumerico: 0.649, status: 'warning' },
      isdel: { valor: '0,38', valorNumerico: 0.38, status: 'alert' },
      tempo_abertura: { valor: '24h', valorNumerico: 24, status: 'warning' },
      tempo_viabilidade: { valor: '28 dias', valorNumerico: 28, status: 'warning' },
      ranking_redesim: { valor: 'Parcial', status: 'warning' },
      tempo_licenciamento: { valor: '20 dias', valorNumerico: 20, status: 'warning' },
      trabalhadores_ct: { valor: '290', valorNumerico: 290, status: 'alert' },
      trabalhadores_tic: { valor: '1,8%', valorNumerico: 1.8, status: 'alert' },
      educacao_isdel: { valor: '4 escolas', valorNumerico: 4, status: 'alert' },
      ensino_medio: { valor: '68%', valorNumerico: 68, status: 'warning' },
      ensino_superior: { valor: '10%', valorNumerico: 10, status: 'alert' },
      negocios_abertos: { valor: '410', valorNumerico: 410, status: 'warning' },
      negocios_extintos: { valor: '380', valorNumerico: 380, status: 'alert' },
    },
  },
  '2513505': {
    nome: 'Santa Rita',
    indicadores: {
      governanca_cfa: { valor: '4,8', valorNumerico: 4.8, status: 'alert' },
      idhm: { valor: '0,641', valorNumerico: 0.641, status: 'warning' },
      isdel: { valor: '0,36', valorNumerico: 0.36, status: 'alert' },
      tempo_abertura: { valor: '26h', valorNumerico: 26, status: 'warning' },
      tempo_viabilidade: { valor: '30 dias', valorNumerico: 30, status: 'alert' },
      ranking_redesim: { valor: 'Não aderiu', status: 'alert' },
      tempo_licenciamento: { valor: '22 dias', valorNumerico: 22, status: 'alert' },
      trabalhadores_ct: { valor: '210', valorNumerico: 210, status: 'alert' },
      trabalhadores_tic: { valor: '1,5%', valorNumerico: 1.5, status: 'alert' },
      educacao_isdel: { valor: '5 escolas', valorNumerico: 5, status: 'alert' },
      ensino_medio: { valor: '64%', valorNumerico: 64, status: 'warning' },
      ensino_superior: { valor: '9%', valorNumerico: 9, status: 'alert' },
      negocios_abertos: { valor: '350', valorNumerico: 350, status: 'warning' },
      negocios_extintos: { valor: '310', valorNumerico: 310, status: 'warning' },
    },
  },
  '2503209': {
    nome: 'Cabedelo',
    indicadores: {
      governanca_cfa: { valor: '7,2', valorNumerico: 7.2, status: 'success' },
      idhm: { valor: '0,748', valorNumerico: 0.748, status: 'success' },
      isdel: { valor: '0,58', valorNumerico: 0.58, status: 'success' },
      tempo_abertura: { valor: '14h', valorNumerico: 14, status: 'success' },
      tempo_viabilidade: { valor: '18 dias', valorNumerico: 18, status: 'success' },
      ranking_redesim: { valor: 'Completo', status: 'success' },
      tempo_licenciamento: { valor: '12 dias', valorNumerico: 12, status: 'success' },
      trabalhadores_ct: { valor: '620', valorNumerico: 620, status: 'success' },
      trabalhadores_tic: { valor: '4,2%', valorNumerico: 4.2, status: 'success' },
      educacao_isdel: { valor: '6 escolas', valorNumerico: 6, status: 'warning' },
      ensino_medio: { valor: '75%', valorNumerico: 75, status: 'success' },
      ensino_superior: { valor: '24%', valorNumerico: 24, status: 'warning' },
      negocios_abertos: { valor: '580', valorNumerico: 580, status: 'success' },
      negocios_extintos: { valor: '290', valorNumerico: 290, status: 'success' },
    },
  },
  '2506301': {
    nome: 'Guarabira',
    indicadores: {
      governanca_cfa: { valor: '5,5', valorNumerico: 5.5, status: 'warning' },
      idhm: { valor: '0,673', valorNumerico: 0.673, status: 'warning' },
      isdel: { valor: '0,42', valorNumerico: 0.42, status: 'warning' },
      tempo_abertura: { valor: '22h', valorNumerico: 22, status: 'warning' },
      tempo_viabilidade: { valor: '25 dias', valorNumerico: 25, status: 'warning' },
      ranking_redesim: { valor: 'Parcial', status: 'warning' },
      tempo_licenciamento: { valor: '18 dias', valorNumerico: 18, status: 'warning' },
      trabalhadores_ct: { valor: '450', valorNumerico: 450, status: 'warning' },
      trabalhadores_tic: { valor: '2,1%', valorNumerico: 2.1, status: 'warning' },
      educacao_isdel: { valor: '5 escolas', valorNumerico: 5, status: 'alert' },
      ensino_medio: { valor: '69%', valorNumerico: 69, status: 'warning' },
      ensino_superior: { valor: '14%', valorNumerico: 14, status: 'alert' },
      negocios_abertos: { valor: '620', valorNumerico: 620, status: 'success' },
      negocios_extintos: { valor: '510', valorNumerico: 510, status: 'warning' },
    },
  },
  '2514602': {
    nome: 'Sousa',
    indicadores: {
      governanca_cfa: { valor: '5,0', valorNumerico: 5.0, status: 'warning' },
      idhm: { valor: '0,668', valorNumerico: 0.668, status: 'warning' },
      isdel: { valor: '0,40', valorNumerico: 0.4, status: 'warning' },
      tempo_abertura: { valor: '25h', valorNumerico: 25, status: 'warning' },
      tempo_viabilidade: { valor: '32 dias', valorNumerico: 32, status: 'alert' },
      ranking_redesim: { valor: 'Não aderiu', status: 'alert' },
      tempo_licenciamento: { valor: '22 dias', valorNumerico: 22, status: 'alert' },
      trabalhadores_ct: { valor: '320', valorNumerico: 320, status: 'warning' },
      trabalhadores_tic: { valor: '1,6%', valorNumerico: 1.6, status: 'alert' },
      educacao_isdel: { valor: '4 escolas', valorNumerico: 4, status: 'alert' },
      ensino_medio: { valor: '66%', valorNumerico: 66, status: 'warning' },
      ensino_superior: { valor: '13%', valorNumerico: 13, status: 'alert' },
      negocios_abertos: { valor: '480', valorNumerico: 480, status: 'warning' },
      negocios_extintos: { valor: '420', valorNumerico: 420, status: 'alert' },
    },
  },
  '2508307': {
    nome: 'Monteiro',
    indicadores: {
      governanca_cfa: { valor: '4,2', valorNumerico: 4.2, status: 'alert' },
      idhm: { valor: '0,628', valorNumerico: 0.628, status: 'alert' },
      isdel: { valor: '0,32', valorNumerico: 0.32, status: 'alert' },
      tempo_abertura: { valor: '30h', valorNumerico: 30, status: 'alert' },
      tempo_viabilidade: { valor: '38 dias', valorNumerico: 38, status: 'alert' },
      ranking_redesim: { valor: 'Não aderiu', status: 'alert' },
      tempo_licenciamento: { valor: '28 dias', valorNumerico: 28, status: 'alert' },
      trabalhadores_ct: { valor: '150', valorNumerico: 150, status: 'alert' },
      trabalhadores_tic: { valor: '0,8%', valorNumerico: 0.8, status: 'alert' },
      educacao_isdel: { valor: '2 escolas', valorNumerico: 2, status: 'alert' },
      ensino_medio: { valor: '60%', valorNumerico: 60, status: 'alert' },
      ensino_superior: { valor: '8%', valorNumerico: 8, status: 'alert' },
      negocios_abertos: { valor: '280', valorNumerico: 280, status: 'alert' },
      negocios_extintos: { valor: '310', valorNumerico: 310, status: 'alert' },
    },
  },
  '2511004': {
    nome: 'Pombal',
    indicadores: {
      governanca_cfa: { valor: '4,8', valorNumerico: 4.8, status: 'alert' },
      idhm: { valor: '0,634', valorNumerico: 0.634, status: 'alert' },
      isdel: { valor: '0,34', valorNumerico: 0.34, status: 'alert' },
      tempo_abertura: { valor: '27h', valorNumerico: 27, status: 'warning' },
      tempo_viabilidade: { valor: '33 dias', valorNumerico: 33, status: 'alert' },
      ranking_redesim: { valor: 'Não aderiu', status: 'alert' },
      tempo_licenciamento: { valor: '24 dias', valorNumerico: 24, status: 'alert' },
      trabalhadores_ct: { valor: '180', valorNumerico: 180, status: 'alert' },
      trabalhadores_tic: { valor: '1,0%', valorNumerico: 1.0, status: 'alert' },
      educacao_isdel: { valor: '3 escolas', valorNumerico: 3, status: 'alert' },
      ensino_medio: { valor: '62%', valorNumerico: 62, status: 'warning' },
      ensino_superior: { valor: '10%', valorNumerico: 10, status: 'alert' },
      negocios_abertos: { valor: '310', valorNumerico: 310, status: 'warning' },
      negocios_extintos: { valor: '290', valorNumerico: 290, status: 'alert' },
    },
  },
  '2504405': {
    nome: 'Catolé do Rocha',
    indicadores: {
      governanca_cfa: { valor: '4,4', valorNumerico: 4.4, status: 'alert' },
      idhm: { valor: '0,645', valorNumerico: 0.645, status: 'warning' },
      isdel: { valor: '0,33', valorNumerico: 0.33, status: 'alert' },
      tempo_abertura: { valor: '29h', valorNumerico: 29, status: 'alert' },
      tempo_viabilidade: { valor: '36 dias', valorNumerico: 36, status: 'alert' },
      ranking_redesim: { valor: 'Não aderiu', status: 'alert' },
      tempo_licenciamento: { valor: '26 dias', valorNumerico: 26, status: 'alert' },
      trabalhadores_ct: { valor: '120', valorNumerico: 120, status: 'alert' },
      trabalhadores_tic: { valor: '0,9%', valorNumerico: 0.9, status: 'alert' },
      educacao_isdel: { valor: '2 escolas', valorNumerico: 2, status: 'alert' },
      ensino_medio: { valor: '61%', valorNumerico: 61, status: 'alert' },
      ensino_superior: { valor: '9%', valorNumerico: 9, status: 'alert' },
      negocios_abertos: { valor: '240', valorNumerico: 240, status: 'alert' },
      negocios_extintos: { valor: '260', valorNumerico: 260, status: 'alert' },
    },
  },
  '2505600': {
    nome: 'Esperança',
    indicadores: {
      governanca_cfa: { valor: '4,0', valorNumerico: 4.0, status: 'alert' },
      idhm: { valor: '0,623', valorNumerico: 0.623, status: 'alert' },
      isdel: { valor: '0,30', valorNumerico: 0.3, status: 'alert' },
      tempo_abertura: { valor: '32h', valorNumerico: 32, status: 'alert' },
      tempo_viabilidade: { valor: '40 dias', valorNumerico: 40, status: 'alert' },
      ranking_redesim: { valor: 'Não aderiu', status: 'alert' },
      tempo_licenciamento: { valor: '30 dias', valorNumerico: 30, status: 'alert' },
      trabalhadores_ct: { valor: '90', valorNumerico: 90, status: 'alert' },
      trabalhadores_tic: { valor: '0,6%', valorNumerico: 0.6, status: 'alert' },
      educacao_isdel: { valor: '1 escola', valorNumerico: 1, status: 'alert' },
      ensino_medio: { valor: '58%', valorNumerico: 58, status: 'alert' },
      ensino_superior: { valor: '7%', valorNumerico: 7, status: 'alert' },
      negocios_abertos: { valor: '180', valorNumerico: 180, status: 'alert' },
      negocios_extintos: { valor: '220', valorNumerico: 220, status: 'alert' },
    },
  },
}
