// Card de uma esfera (federal ou estadual) para o município selecionado:
// empenhado + pago, quebra por ano e — no estadual — a ressalva de estimativa.

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
    <div className={`card-surface flex flex-col gap-sm p-md ${className}`}>
      <div className="flex-between gap-sm">
        <div className="flex flex-col">
          <span className="typo-body-bold">{copy.titulo}</span>
          <span className="typo-body-sm text-inactive">
            {copy.autores} · {meta.janela.de}–{meta.janela.ate}
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
          {/* Métricas em linhas (rótulo à esquerda, valor à direita) em vez de duas
              colunas: lado a lado com whitespace-nowrap os valores estouravam a
              largura do card na coluna estreita do painel. */}
          <div className="flex flex-col gap-2xs">
            <div className="flex-between gap-sm">
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
            <div className="flex-between gap-sm">
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

          {anos.length > 0 && (
            <div className="flex flex-col gap-2xs">
              <span className="typo-body-sm text-inactive">Pago {copy.notaAno}</span>
              <div className="flex flex-wrap gap-x-md gap-y-xs">
                {anos.map((ano) => (
                  <div key={ano} className="flex flex-col">
                    <span className="typo-body-sm-bold">{ano}</span>
                    <span
                      className="typo-body-sm whitespace-nowrap"
                      title={formatReaisCheio(valores.porAno[ano]?.pago)}
                    >
                      {formatReaisCurto(valores.porAno[ano]?.pago)}
                    </span>
                  </div>
                ))}
              </div>
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
