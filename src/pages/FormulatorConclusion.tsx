// Rota /formulador/conclusao — tela de revisão.
// Sidebar esquerda (ProjectSteps com todas as etapas marcadas como visitadas)
// + coluna central com 3 botões de ação e resumo das 10 etapas.
// Sem AIAssistant na lateral direita.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/buttons/Button'
import NumberBullet from '@/components/ui/NumberBullet'
import ProjectSteps from '@/components/formulator/ProjectSteps'
import { formulatorSteps } from '@/data/formulator/steps'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'
import type { FormulatorState } from '@/types/formulator'
import { isStepComplete } from '@/utils/formulatorCompleteness'
import { trackEvent } from '@/utils/analytics'

function joinNonEmpty(parts: string[], sep = '\n'): string {
  return parts.filter((p) => p && p.trim().length > 0).join(sep)
}

// Parse um textarea multi-linha (formato "Rótulo: Valor" por linha) em blocos
// label/value individuais. Linhas sem ":" entram com label vazio (o renderer
// só renderiza o <p> da label quando ela existe).
function parseLinesIntoBlocks(text: string): { label: string; value: string }[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(':')
      if (i === -1) return { label: '', value: line }
      return { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() }
    })
}

// Parsing/formatação BRL — espelha o que StepBudget faz pra preencher o
// campo "Valor Total" calculado a partir das rubricas.
function parseValue(valor: string): number {
  const cleaned = valor
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const num = parseFloat(cleaned)
  return Number.isFinite(num) ? num : 0
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

function renderSection(
  slug: string,
  state: FormulatorState,
  municipalityName: string,
): { blocks: { label: string; value: string }[] } {
  switch (slug) {
    case 'identificacao': {
      const d = state.identification
      return {
        blocks: [
          { label: 'Título do Projeto', value: d.title },
          { label: 'Município', value: municipalityName },
          { label: 'Responsável', value: d.responsible },
          { label: 'Órgão Executor', value: d.organization },
          { label: 'Duração Prevista', value: d.duration },
        ],
      }
    }
    case 'justificativa': {
      const d = state.justification
      return {
        blocks: [
          { label: 'Problema Central', value: d.problem },
          { label: 'Evidências e Dados', value: d.evidence },
          { label: 'Impacto da Inação', value: d.impact },
        ],
      }
    }
    case 'objetivos': {
      const d = state.objectives
      return {
        blocks: [
          { label: 'Objetivo Geral', value: d.general },
          { label: 'Objetivos Específicos', value: joinNonEmpty(d.specific.map((t) => t ? `• ${t}` : '')) },
        ],
      }
    }
    case 'publico-alvo': {
      const d = state.targetAudience
      return {
        blocks: [
          { label: 'Público Principal', value: d.primary },
          { label: 'Público Secundário', value: d.secondary },
          { label: 'Estimativa de Beneficiários', value: d.estimate },
        ],
      }
    }
    case 'plano-acao': {
      const d = state.actionPlan
      const activitiesBullets = joinNonEmpty(
        d.activities
          .split('\n')
          .map((t) => (t.trim() ? `• ${t.trim()}` : '')),
      )
      return {
        blocks: [
          { label: 'Principais Ações', value: activitiesBullets },
          { label: 'Metodologia', value: d.methodology },
        ],
      }
    }
    case 'cronograma': {
      const d = state.timeline
      // Espalha as fases (e marcos) em blocos individuais — cada linha do
      // textarea no formato "Fase 1 - Diagnóstico: Meses 1-2" vira uma
      // linha label/value, como no Figma.
      return {
        blocks: [...parseLinesIntoBlocks(d.phases), ...parseLinesIntoBlocks(d.milestones)],
      }
    }
    case 'indicadores': {
      const d = state.indicators
      return {
        blocks: [
          { label: 'Indicadores de Resultado', value: joinNonEmpty(d.results.map((t, i) => t ? `Indicador ${i + 1}: ${t}` : '')) },
          { label: 'Indicadores de Impacto', value: joinNonEmpty(d.impact.map((t, i) => t ? `Indicador ${i + 1}: ${t}` : '')) },
          { label: 'Metas Quantitativas', value: joinNonEmpty(d.quantitative.map((t, i) => t ? `Meta ${i + 1}: ${t}` : '')) },
        ],
      }
    }
    case 'orcamento': {
      const d = state.budget
      const total = d.items.reduce((acc, r) => acc + parseValue(r.value), 0)
      const itemBlocks = d.items
        .filter((r) => r.label || r.value)
        .map((r) => ({ label: r.label || '—', value: r.value || '—' }))
      return {
        blocks: [
          ...(total > 0 ? [{ label: 'Valor Total do Projeto', value: formatBRL(total) }] : []),
          ...itemBlocks,
        ],
      }
    }
    case 'sustentabilidade': {
      const d = state.sustainability
      return {
        blocks: [
          { label: 'Estratégia de Continuidade', value: d.continuity },
          { label: 'Parcerias Previstas', value: d.partnerships },
        ],
      }
    }
    case 'governanca': {
      const d = state.governance
      return {
        blocks: [
          { label: 'Estrutura de Gestão', value: d.management },
          { label: 'Monitoramento e Avaliação', value: d.monitoring },
          { label: 'Prestação de Contas', value: d.accountability },
        ],
      }
    }
    default:
      return { blocks: [] }
  }
}

export default function FormulatorConclusion() {
  const { state } = useFormulator()
  const { municipality } = useMunicipality()
  const navigate = useNavigate()
  const allVisited = formulatorSteps.map((e) => e.slug)
  const completedSlugs = formulatorSteps
    .filter((e) => isStepComplete(e.slug, state))
    .map((e) => e.slug)

  const projectTitle = state.identification.title.trim()

  useEffect(() => {
    trackEvent('formulador_concluido', {
      steps_completos: completedSlugs.length,
      total_steps: formulatorSteps.length,
    })
  }, [completedSlugs.length])

  return (
    <div className="flex items-start gap-sm w-full">
      <ProjectSteps
        currentSlug=""
        visitedSlugs={allVisited}
        completedSlugs={completedSlugs}
      />

      <Card padding="lg" radius="sm" className="flex flex-col gap-lg flex-1">
        <div className="flex flex-col gap-xs">
          <h2 className="typo-body-lg-bold">Conclusão</h2>
          <p className="typo-body">Confira as informações sobre o seu projeto antes da submissão final</p>
        </div>

        <div className="flex items-center gap-sm">
          <Button label="Editar projeto" variant="tertiary" size="md" onClick={() => history.back()} />
          <Button label="Baixar PDF" variant="tertiary" size="md" onClick={() => window.print()} />
          <Button
            label="Voltar para home"
            variant="primary"
            size="md"
            onClick={() => navigate('/')}
            className="ml-auto"
          />
        </div>

        {/* Tudo a partir daqui (.print-area) é o que o PDF captura. Acima,
            o título/subtítulo da Conclusão e a linha de botões ficam ocultos
            no @media print via CSS. */}
        <div className="print-area flex flex-col gap-lg">
          {/* Título exclusivo do PDF — só aparece no print. */}
          <div className="hidden print:flex print:flex-col print:gap-xs">
            <h1 className="typo-h2">Resumo do projeto</h1>
            {projectTitle && <p className="typo-body-lg-bold">{projectTitle}</p>}
            <p className="typo-body">{municipality.name}</p>
          </div>

          <div className="flex flex-col gap-md">
          {formulatorSteps.map((step, idx) => {
            const { blocks } = renderSection(step.slug, state, municipality.name)
            const hasContent = blocks.some((b) => b.value && b.value.trim().length > 0)
            return (
              <div key={step.slug} className="flex flex-col gap-sm">
                <div className="flex items-center gap-xs">
                  <NumberBullet value={idx + 1} variant="primary" />
                  <span className="typo-body-bold">{step.title}</span>
                </div>
                <div className="bg-primary rounded-sm p-md flex flex-col gap-xs">
                  {hasContent ? (
                    blocks.map((b, i) => b.value && (
                      <div key={i} className="flex flex-col gap-2xs">
                        {b.label && <p className="typo-body-sm-bold text-inactive">{b.label}</p>}
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
        </div>
      </Card>
    </div>
  )
}
