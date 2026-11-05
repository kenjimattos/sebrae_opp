import type { EmendaEsfera, EmendaValores, EmendasData } from '@/types/emendas'
import { formatBRL } from '@/utils/currency'

/**
 * R$ abreviado em escala BR (bi/mi/mil). Os valores vão de milhares a bilhões no
 * mesmo mapa, então o número cheio quebraria a leitura dos cards e do tooltip.
 */
export function formatReaisCurto(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  if (v === 0) return 'R$ 0'
  const abs = Math.abs(v)
  const fmt = (n: number, casas: number) =>
    n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
  if (abs >= 1e9) return `R$ ${fmt(v / 1e9, 2)} bi`
  if (abs >= 1e6) return `R$ ${fmt(v / 1e6, 2)} mi`
  if (abs >= 1e3) return `R$ ${fmt(v / 1e3, 0)} mil`
  return `R$ ${fmt(v, 0)}`
}

/**
 * R$ por extenso, para tooltips e detalhamento onde a precisão importa. Só
 * acrescenta ao `formatBRL` o que é próprio das emendas: ausência de valor —
 * que aqui é significativa (ver a regra do zero estadual em CLAUDE.md).
 */
export function formatReaisCheio(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return formatBRL(v)
}

/** Anos presentes na quebra anual, em ordem crescente. */
export function anosDe(valores: EmendaValores | null | undefined): string[] {
  if (!valores?.porAno) return []
  return Object.keys(valores.porAno).sort()
}

export interface LinhaFuncao {
  funcao: string
  empenhado: number
  pago: number
  /** Empenhado que ainda não foi pago. */
  emAberto: number
  /** pago / empenhado (0–1); `null` quando não há empenhado — divisão sem sentido. */
  fracaoPaga: number | null
  nEmendas: number
}

/**
 * Linhas da tabela por função, da maior para a menor em empenhado.
 *
 * `emAberto` é `empenhado − pago` e pode sair negativo: o pago é o do documento de
 * pagamento (inclui restos a pagar de safras anteriores à janela do empenho), então
 * numa função pequena ele pode passar do empenhado. Não é cortado em zero porque
 * esconder o sinal esconderia o motivo de a linha não fechar.
 */
export function linhasPorFuncao(valores: EmendaValores | null | undefined): LinhaFuncao[] {
  if (!valores?.porFuncao) return []
  return Object.entries(valores.porFuncao)
    .map(([funcao, v]) => ({
      funcao,
      empenhado: v.empenhado,
      pago: v.pago,
      emAberto: Math.round((v.empenhado - v.pago) * 100) / 100,
      fracaoPaga: v.empenhado > 0 ? v.pago / v.empenhado : null,
      nEmendas: v.nEmendas,
    }))
    .sort((a, b) => b.empenhado - a.empenhado || a.funcao.localeCompare(b.funcao, 'pt-BR'))
}

/** Percentual com vírgula e uma casa ("91,3%"); `—` sem base de comparação. */
export function formatPercentual(fracao: number | null): string {
  if (fracao === null || Number.isNaN(fracao)) return '—'
  return `${(fracao * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

// Funções listadas por esfera no resumo da IA. As três maiores cobrem a maior parte
// do valor em quase todo município, e o resumo vai em toda pergunta do chat.
const FUNCOES_NO_RESUMO = 3

const ROTULO_ESFERA: Record<EmendaEsfera, string> = {
  federal: 'EMENDAS FEDERAIS',
  estadual: 'EMENDAS ESTADUAIS (ALPB)',
}

const emendas = (n: number) => `${n} ${n === 1 ? 'emenda' : 'emendas'}`

/** "valor / empenhado / pago" no estadual, "empenhado / pago" no federal. */
function trinca(v: { valor?: number; empenhado: number; pago: number }, comValor: boolean): string {
  const partes = [formatReaisCurto(v.empenhado), formatReaisCurto(v.pago)]
  return (comValor ? [formatReaisCurto(v.valor), ...partes] : partes).join(' / ')
}

/**
 * Resumo das emendas de um município para o chat da IA, montado no cliente porque o
 * handler não lê o banco. Uma seção por esfera, **nunca somadas**: o federal é censo
 * por código IBGE e o estadual é estimativa a partir de texto livre (ver CLAUDE.md,
 * "As duas esferas de emendas nunca se somam"). Cada seção leva a procedência e o
 * eixo do `porAno`, que muda de sentido entre as esferas — sem isso o modelo leria o
 * mesmo "2024" como a mesma coisa nas duas.
 *
 * `esferas` restringe o resumo: a análise do modo Emendas manda só a esfera ativa.
 *
 * Esfera `null` não vira zero: no estadual ela quer dizer "não atribuímos nenhuma
 * emenda a este município", que é diferente de "não recebeu". Devolve '' sem dado.
 */
export function emendasAiSummary(
  data: EmendasData | null,
  municipioId: string,
  esferas: readonly EmendaEsfera[] = ['federal', 'estadual'],
): string {
  if (!data) return ''
  const municipio = data.municipios.find((m) => m.id === municipioId)
  if (!municipio) return ''

  return esferas
    .map((esfera) => {
      const meta = data.esferas[esfera]
      const v = municipio[esfera]
      const comValor = esfera === 'estadual'
      const atribuicao =
        meta.atribuicao === 'ibge'
          ? 'município pelo código IBGE da despesa (dado exato)'
          : `município ESTIMADO a partir do texto do objeto da emenda; só ${formatPercentual(meta.coberturaMunicipal)} do valor do estado foi atribuído a algum município`
      const cabecalho =
        `${ROTULO_ESFERA[esfera]} — fonte: ${meta.source}, coletado em ${meta.coletadoEm}; ` +
        `${atribuicao}; janela ${meta.janela.de}–${meta.janela.ate}; ` +
        `ano da quebra anual = ${meta.criterioQuebraAnual}.`
      if (!v) {
        return `${cabecalho}\nNenhuma emenda desta esfera foi atribuída a ${municipio.name}. Não significa que o município não recebeu: a atribuição pode ter falhado.`
      }
      const formato = comValor ? 'valor destinado / empenhado / pago' : 'empenhado / pago'
      const anos = anosDe(v)
        .map((ano) => `${ano}: ${trinca(v.porAno[ano], comValor)}`)
        .join('; ')
      const funcoes = Object.entries(v.porFuncao ?? {})
        .sort(([a, x], [b, y]) => y.empenhado - x.empenhado || a.localeCompare(b, 'pt-BR'))
        .slice(0, FUNCOES_NO_RESUMO)
        .map(([funcao, f]) => `${funcao}: ${trinca(f, comValor)} (${emendas(f.nEmendas)})`)
        .join('; ')
      return [
        cabecalho,
        `Total (${formato}): ${trinca(v, comValor)}; ${emendas(v.nEmendas)} de ${v.nAutores} ${v.nAutores === 1 ? 'autor' : 'autores'}.`,
        anos && `Por ano (${formato}): ${anos}.`,
        funcoes && `Maiores funções (${formato}): ${funcoes}.`,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')
}
