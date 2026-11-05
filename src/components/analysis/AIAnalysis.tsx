// Figma: Economics/Analysis (368:834)
// Análise de desempenho do município, gerada por IA (task `economic-analysis`).
// A casca (CTA, loading, typewriter, "Gerar novamente") é o `AnalysisBlock`; aqui
// fica só o contexto que vai ao modelo e os textos.
//
// Até a task existir, este componente exibia um texto fixo por município e o
// typewriter servia só para simular geração — inclusive com números defasados que
// contradiziam os cards do Panorama. O contexto agora sai da própria API.
//
// Para resetar entre municípios, o consumidor deve passar `key={municipioId}`
// de modo que o componente monte do zero quando trocar o município.

import { useMemo } from 'react'
import {
  analysisLabel,
  emptyAnalysisTitle,
  emptyAnalysisSubtitle,
  generateAnalysisLabel,
  regenerateAnalysisLabel,
  generatingAnalysisLabel,
} from '@/data/home/economic-base'
import { indicatorAiLine } from '@/data/indicators/status-labels'
import { thresholdSegmentLabels } from '@/utils/segmentLabels'
import { useMunicipality } from '@/hooks/useMunicipality'
import type { AiTaskRequest } from '@/types/ai'
import AnalysisBlock, { type AnalysisBlockLabels } from './AnalysisBlock'

const LABELS: AnalysisBlockLabels = {
  emptyTitle: emptyAnalysisTitle,
  emptySubtitle: emptyAnalysisSubtitle,
  title: analysisLabel,
  generate: generateAnalysisLabel,
  regenerate: regenerateAnalysisLabel,
  generating: generatingAnalysisLabel,
}

interface AIAnalysisProps {
  className?: string
}

export default function AIAnalysis({ className = '' }: AIAnalysisProps) {
  const { municipality } = useMunicipality()

  // Só os cards realmente exibidos: é a lista que o prompt autoriza o modelo a citar.
  const economicBase = useMemo(
    () =>
      (municipality.data?.economicBase ?? []).map((i) => ({
        label: i.label,
        value: i.value,
        referenceYear: i.referenceYear,
      })),
    [municipality.data],
  )

  // Indicadores de agenda com status, a régua e DE ONDE ela vem. A faixa é o
  // que ancora o julgamento: sem ela o modelo inventava a própria leitura
  // (chamou IDH-M 0,588 de "avanço", quando 0,588 < 0,600 é Alerta). A
  // procedência é o que impede o erro oposto: apresentar um tercil como padrão
  // oficial, dizendo que o município "atende" a algo que não existe.
  const indicatorsSummary = useMemo(
    () =>
      (municipality.data?.agendas ?? [])
        .flatMap((a) => a.indicators)
        .map((i) => `- ${indicatorAiLine(i, thresholdSegmentLabels(i.threshold))}`)
        .join('\n'),
    [municipality.data],
  )

  // Sem cards não há contexto: o modelo preencheria o vazio inventando números.
  const request: AiTaskRequest | null =
    economicBase.length === 0
      ? null
      : {
          task: 'economic-analysis',
          municipality: { id: municipality.id, name: municipality.name },
          economicBase,
          indicatorsSummary: indicatorsSummary !== '' ? indicatorsSummary : undefined,
        }

  return <AnalysisBlock request={request} labels={LABELS} className={className} />
}
