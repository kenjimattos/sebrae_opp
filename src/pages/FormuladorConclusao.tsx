// Rota /formulador/conclusao — tela de revisão.
// Sidebar esquerda (ProjectSteps com todas as etapas marcadas como visitadas)
// + coluna central com 3 botões de ação, banner de sucesso e resumo das 10 etapas.
// Sem AIAssistant na lateral direita.

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/buttons/Button'
import NumberBullet from '@/components/ui/NumberBullet'
import ProjectSteps from '@/components/formulador/ProjectSteps'
import { Check, ArrowRight } from '@/components/icons'
import { etapasFormulador } from '@/data/formulador-etapas'
import { useFormulador } from '@/hooks/useFormulador'
import { useMunicipio } from '@/hooks/useMunicipio'
import type { FormuladorState } from '@/types/formulador'
import { iconSizes } from '@/components/icons'

function joinNonEmpty(parts: string[], sep = '\n'): string {
  return parts.filter((p) => p && p.trim().length > 0).join(sep)
}

function renderSection(
  slug: string,
  state: FormuladorState,
  municipioNome: string,
): { blocks: { label: string; value: string }[] } {
  switch (slug) {
    case 'identificacao': {
      const d = state.identificacao
      return {
        blocks: [
          { label: 'Título do Projeto', value: d.titulo },
          { label: 'Município', value: municipioNome },
          { label: 'Responsável', value: d.responsavel },
          { label: 'Órgão Executor', value: d.orgao },
          { label: 'Duração Prevista', value: d.duracao },
        ],
      }
    }
    case 'justificativa': {
      const d = state.justificativa
      return {
        blocks: [
          { label: 'Problema central', value: d.problema },
          { label: 'Evidências e Dados', value: d.evidencias },
          { label: 'Impacto da Inação', value: d.impacto },
        ],
      }
    }
    case 'objetivos': {
      const d = state.objetivos
      return {
        blocks: [
          { label: 'Objetivo Geral', value: d.geral },
          { label: 'Objetivos Específicos', value: joinNonEmpty(d.especificos.map((t) => t ? `• ${t}` : '')) },
        ],
      }
    }
    case 'publico-alvo': {
      const d = state.publicoAlvo
      return {
        blocks: [
          { label: 'Público Principal', value: d.principal },
          { label: 'Público Secundário', value: d.secundario },
          { label: 'Estimativa de Beneficiários', value: d.estimativa },
        ],
      }
    }
    case 'plano-acao': {
      const d = state.planoAcao
      const atividadesBullets = joinNonEmpty(
        d.atividades
          .split('\n')
          .map((t) => (t.trim() ? `• ${t.trim()}` : '')),
      )
      return {
        blocks: [
          { label: 'Atividades Previstas', value: atividadesBullets },
          { label: 'Metodologia', value: d.metodologia },
        ],
      }
    }
    case 'cronograma': {
      const d = state.cronograma
      return {
        blocks: [
          { label: 'Fases do projeto', value: d.fases },
          { label: 'Marcos e Entregas', value: d.marcos },
        ],
      }
    }
    case 'indicadores': {
      const d = state.indicadores
      return {
        blocks: [
          { label: 'Indicadores de Resultado', value: joinNonEmpty(d.resultado.map((t, i) => t ? `Indicador ${i + 1}: ${t}` : '')) },
          { label: 'Indicadores de Impacto', value: joinNonEmpty(d.impacto.map((t, i) => t ? `Indicador ${i + 1}: ${t}` : '')) },
          { label: 'Metas Quantitativas', value: joinNonEmpty(d.quantitativas.map((t, i) => t ? `Meta ${i + 1}: ${t}` : '')) },
        ],
      }
    }
    case 'orcamento': {
      const d = state.orcamento
      return {
        blocks: [
          {
            label: 'Rubricas',
            value: joinNonEmpty(
              d.rubricas.map((r) => (r.label || r.valor) ? `${r.label || '—'}: ${r.valor || '—'}` : ''),
            ),
          },
        ],
      }
    }
    case 'sustentabilidade': {
      const d = state.sustentabilidade
      return {
        blocks: [
          { label: 'Estratégia de Continuidade', value: d.continuidade },
          { label: 'Parcerias Institucionais', value: d.parcerias },
        ],
      }
    }
    case 'governanca': {
      const d = state.governanca
      return {
        blocks: [
          { label: 'Estrutura de Gestão', value: d.gestao },
          { label: 'Monitoramento e Avaliação', value: d.monitoramento },
          { label: 'Prestação de Contas', value: d.prestacaoContas },
        ],
      }
    }
    default:
      return { blocks: [] }
  }
}

export default function FormuladorConclusao() {
  const { state } = useFormulador()
  const { municipio } = useMunicipio()
  const allVisited = etapasFormulador.map((e) => e.slug)
  const [enviado, setEnviado] = useState(false)

  return (
    <div className="flex items-start gap-md w-full">
      <ProjectSteps
        currentSlug=""
        visitedSlugs={allVisited}
        className="w-[229px] shrink-0"
      />

      <Card padding="lg" radius="md" className="flex flex-col gap-lg flex-1">
        <div className="flex flex-col gap-xs">
          <h2 className="typo-body-lg-bold">Conclusão</h2>
          <p className="typo-body">Confira as informações sobre o seu projeto antes da submissão final</p>
        </div>

        <div className="flex items-center gap-sm">
          <Button label="Editar projeto" variant="tertiary" size="md" onClick={() => history.back()} />
          <Button label="Baixar PDF" variant="tertiary" size="md" onClick={() => window.print()} />
          <Button
            label={enviado ? 'Enviado' : 'Enviar para análise'}
            variant={enviado ? 'success' : 'primary'}
            size="md"
            icon={enviado ? Check : ArrowRight}
            iconPosition="right"
            onClick={() => !enviado && setEnviado(true)}
            className="ml-auto"
          />
        </div>

        {enviado && (
          <Card surface="success" padding="md" radius="sm" bordered className="flex items-start gap-sm">
            <Check size={iconSizes.md} className="shrink-0 text-[color:var(--semantic-success)] mt-[2px]" />
            <div className="flex flex-col gap-2xs">
              <p className="typo-body-bold">Projeto enviado com sucesso!</p>
              <p className="typo-body-sm">Seu projeto agora segue para análise. Fique atento aos canais de comunicação.</p>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-md">
          {etapasFormulador.map((etapa, idx) => {
            const { blocks } = renderSection(etapa.slug, state, municipio.nome)
            const hasContent = blocks.some((b) => b.value && b.value.trim().length > 0)
            return (
              <div key={etapa.slug} className="flex flex-col gap-sm">
                <div className="flex items-center gap-xs">
                  <NumberBullet value={idx + 1} variant="primary" />
                  <span className="typo-body-bold">{etapa.titulo}</span>
                </div>
                <div className="bg-primary radius-sm p-md flex flex-col gap-xs">
                  {hasContent ? (
                    blocks.map((b) => b.value && (
                      <div key={b.label} className="flex flex-col gap-2xs">
                        <p className="typo-body-sm-bold text-inactive">{b.label}</p>
                        <p className="typo-body-sm whitespace-pre-line">{b.value}</p>
                      </div>
                    ))
                  ) : (
                    <p className="typo-body-sm text-inactive">Sem informações preenchidas</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
