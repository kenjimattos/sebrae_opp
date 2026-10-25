// Emendas de um município quebradas por função orçamentária (Saúde, Urbanismo,
// Agricultura…), numa esfera: empenhado, pago e o que ainda está em aberto,
// somados na janela inteira. As duas esferas usam os mesmos nomes de função.

import { resourcesContent } from '@/data/home/resources'
import type { EmendaEsfera, EmendaEsferaMeta, EmendaValores } from '@/types/emendas'
import {
  formatPercentual,
  formatReaisCheio,
  formatReaisCurto,
  linhasPorFuncao,
} from '@/utils/emendas'

interface EmendasFuncaoTableProps {
  esfera: EmendaEsfera
  meta: EmendaEsferaMeta
  valores: EmendaValores | null
  className?: string
}

export default function EmendasFuncaoTable({
  esfera,
  meta,
  valores,
  className = '',
}: EmendasFuncaoTableProps) {
  const linhas = linhasPorFuncao(valores)
  if (linhas.length === 0) return null

  const copy = resourcesContent.funcao
  const th = 'typo-body-sm text-inactive text-left font-normal pb-xs'
  // Cabeçalho numérico com o mesmo recuo e o mesmo nowrap das células: em meia
  // largura (as duas esferas lado a lado) "Pago" e "Em aberto" encostavam.
  const thNum = `${th} text-right whitespace-nowrap pl-sm`

  return (
    <div className={`glass rounded flex flex-col gap-xs p-md ${className}`}>
      <div className="flex flex-col">
        <span className="typo-body-bold">{copy.titulo[esfera]}</span>
        <span className="typo-body-sm text-inactive">
          {copy.subtitulo} ·{' '}
          <span className="whitespace-nowrap">
            {meta.janela.de}–{meta.janela.ate}
          </span>
        </span>
      </div>

      {/* Rede de segurança: se a tabela não couber, rola ela, não a página. Quem
          monta já evita meia coluna estreita (ver ModeResources, `xl:col-span-1`). */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <caption className="sr-only">{copy.caption[esfera]}</caption>
          <thead>
            <tr className="border-b border-divider">
              <th scope="col" className={th}>
                {copy.colunas.funcao}
              </th>
              <th scope="col" className={thNum}>
                {resourcesContent.metricas.empenhado}
              </th>
              <th scope="col" className={thNum}>
                {resourcesContent.metricas.pago}
              </th>
              <th scope="col" className={thNum}>
                {copy.colunas.emAberto}
              </th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.funcao} className="border-b border-divider last:border-b-0">
                <th scope="row" className="typo-body-sm text-left font-normal py-xs pr-sm">
                  {l.funcao}
                  <span className="block typo-body-sm text-inactive">
                    {l.nEmendas} {l.nEmendas === 1 ? 'emenda' : 'emendas'}
                  </span>
                </th>
                <td
                  className="typo-body-sm-bold text-right whitespace-nowrap py-xs pl-sm"
                  title={formatReaisCheio(l.empenhado)}
                >
                  {formatReaisCurto(l.empenhado)}
                </td>
                <td
                  className="typo-body-sm-bold text-right whitespace-nowrap py-xs pl-sm"
                  title={formatReaisCheio(l.pago)}
                >
                  {formatReaisCurto(l.pago)}
                  <span className="block typo-body-sm text-inactive font-normal">
                    {formatPercentual(l.fracaoPaga)}
                  </span>
                </td>
                <td
                  className="typo-body-sm text-right whitespace-nowrap py-xs pl-sm"
                  title={formatReaisCheio(l.emAberto)}
                >
                  {formatReaisCurto(l.emAberto)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <span className="typo-body-sm text-inactive">{copy.nota[esfera]}</span>
    </div>
  )
}
