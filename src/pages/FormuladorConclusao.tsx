// Rota /formulador/conclusao — tela de revisão.
// Sidebar esquerda (ProjectSteps com todas as etapas marcadas como visitadas)
// + coluna central com 3 botões de ação e resumo das 10 etapas.
// Sem AIAssistant na lateral direita.

import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/buttons/Button'
import NumberBullet from '@/components/ui/NumberBullet'
import ProjectSteps from '@/components/formulador/ProjectSteps'
import { etapasFormulador } from '@/data/formulador-etapas'
import { useFormulador } from '@/hooks/useFormulador'
import { useMunicipio } from '@/hooks/useMunicipio'
import type { FormuladorState } from '@/types/formulador'
import { isEtapaCompleta } from '@/utils/formuladorCompleteness'

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

// Parsing/formatação BRL — espelha o que StepOrcamento faz pra preencher o
// campo "Valor Total" calculado a partir das rubricas.
function parseValor(valor: string): number {
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
          { label: 'Problema Central', value: d.problema },
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
          { label: 'Principais Ações', value: atividadesBullets },
          { label: 'Metodologia', value: d.metodologia },
        ],
      }
    }
    case 'cronograma': {
      const d = state.cronograma
      // Espalha as fases (e marcos) em blocos individuais — cada linha do
      // textarea no formato "Fase 1 - Diagnóstico: Meses 1-2" vira uma
      // linha label/value, como no Figma.
      return {
        blocks: [...parseLinesIntoBlocks(d.fases), ...parseLinesIntoBlocks(d.marcos)],
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
      const total = d.rubricas.reduce((acc, r) => acc + parseValor(r.valor), 0)
      const rubricaBlocks = d.rubricas
        .filter((r) => r.label || r.valor)
        .map((r) => ({ label: r.label || '—', value: r.valor || '—' }))
      return {
        blocks: [
          ...(total > 0 ? [{ label: 'Valor Total do Projeto', value: formatBRL(total) }] : []),
          ...rubricaBlocks,
        ],
      }
    }
    case 'sustentabilidade': {
      const d = state.sustentabilidade
      return {
        blocks: [
          { label: 'Estratégia de Continuidade', value: d.continuidade },
          { label: 'Parcerias Previstas', value: d.parcerias },
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
  const navigate = useNavigate()
  const allVisited = etapasFormulador.map((e) => e.slug)
  const completedSlugs = etapasFormulador
    .filter((e) => isEtapaCompleta(e.slug, state))
    .map((e) => e.slug)

  const tituloProjeto = state.identificacao.titulo.trim()

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
            {tituloProjeto && <p className="typo-body-lg-bold">{tituloProjeto}</p>}
            <p className="typo-body">{municipio.nome}</p>
          </div>

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
