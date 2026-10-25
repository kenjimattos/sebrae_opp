// Card de uma esfera (federal ou estadual) para o município selecionado:
// empenhado + pago, quebra por ano e — no estadual — a ressalva de estimativa.

import BreakdownBars from '@/components/estado/BreakdownBars'
import InfoTooltip from '@/components/ui/InfoTooltip'
import { resourcesContent } from '@/data/home/resources'
import type { EmendaEsfera, EmendaEsferaMeta, EmendaValores } from '@/types/emendas'
import { anosDe, formatReaisCheio, formatReaisCurto } from '@/utils/emendas'

interface EmendasEsferaCardProps {
  esfera: EmendaEsfera
  meta: EmendaEsferaMeta
  valores: EmendaValores | null
  className?: string
}

export default function EmendasEsferaCard({
  esfera,
  meta,
  valores,
  className = '',
}: EmendasEsferaCardProps) {
  const copy = resourcesContent.esferas[esfera]
  const anos = anosDe(valores)
  const estimativa = meta.atribuicao === 'texto-beneficiario'

  return (
    // `.glass` não traz border-radius — vem do `rounded`.
    <div className={`glass rounded flex flex-col gap-xs p-md ${className}`}>
      <div className="flex-between gap-sm">
        <div className="flex flex-col">
          <span className="typo-body-bold">{copy.titulo}</span>
          <span className="typo-body-sm text-inactive">
            {copy.autores} ·{' '}
            {/* nowrap: senão o intervalo quebra no meio ("2023-" / "2026") */}
            <span className="whitespace-nowrap">
              {meta.janela.de}–{meta.janela.ate}
            </span>
          </span>
        </div>
        {estimativa && copy.qualidade && (
          <InfoTooltip
            label="Sobre a estimativa do valor estadual"
            title="Valor estimado"
            subtitle={copy.qualidade.replace(
              '{cobertura}',
              `${Math.round(meta.coberturaMunicipal * 100)}%`,
            )}
          />
        )}
      </div>

      {!valores ? (
        <span className="typo-body text-inactive">Sem emendas registradas no período.</span>
      ) : (
        <>
          {/* Empenhado e pago lado a lado, rótulo sobre o valor: o card ocupa a
              largura do painel, e em linhas (rótulo à esquerda, valor à direita)
              os dois ficavam a centenas de pixels um do outro. */}
          <div className="flex flex-wrap gap-x-xl gap-y-xs">
            <div className="flex flex-col">
              <span className="typo-body-sm text-inactive">
                {resourcesContent.metricas.empenhado}
              </span>
              <span
                className="typo-body-lg-bold whitespace-nowrap"
                title={formatReaisCheio(valores.empenhado)}
              >
                {formatReaisCurto(valores.empenhado)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="typo-body-sm text-inactive">
                {resourcesContent.metricas.pago}
              </span>
              <span
                className="typo-body-lg-bold text-accent whitespace-nowrap"
                title={formatReaisCheio(valores.pago)}
              >
                {formatReaisCurto(valores.pago)}
              </span>
            </div>
          </div>

          {/* Só com algum pago: barra é zero-based e, tudo zerado, o gráfico não teria
              escala — sobraria o título sozinho. */}
          {anos.some((ano) => (valores.porAno[ano]?.pago ?? 0) > 0) && (
            <div className="flex flex-col gap-xs">
              <span className="typo-body-sm text-inactive">Pago {copy.notaAno}</span>
              {/* Barras zero-based, escala = o maior ano do próprio município: compara
                  os anos entre si, não o município com o estado. Ano em ordem
                  crescente, de cima para baixo. */}
              <BreakdownBars
                slices={anos.map((ano) => ({ label: ano, value: valores.porAno[ano]?.pago ?? 0 }))}
                formatValue={formatReaisCurto}
                formatTitle={formatReaisCheio}
                labelClassName="w-12"
                // Valor em largura fixa (cabe "R$ 168,61 mi") e gráfico contido: com a
                // coluna de valor em 1/5, sobrava um vão de ~200px entre a barra e o número.
                valueClassName="w-28"
                className="max-w-[640px]"
              />
            </div>
          )}

          <span className="typo-body-sm text-inactive">
            {valores.nEmendas} {valores.nEmendas === 1 ? 'emenda' : 'emendas'} ·{' '}
            {valores.nAutores} {valores.nAutores === 1 ? 'autor' : 'autores'}
          </span>
        </>
      )}
    </div>
  )
}
