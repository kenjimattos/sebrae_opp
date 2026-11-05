// Leitura por IA das emendas do município, na esfera ativa do modo Emendas
// (task `emendas-analysis`). Uma esfera por vez, como o resto da tela: analisar
// as duas juntas convidaria o modelo a somá-las ou compará-las, que é justamente
// o que a plataforma não faz (federal é censo por IBGE, estadual é estimativa).
//
// O contexto é o mesmo resumo que o chat recebe (`emendasAiSummary`), restrito à
// esfera. Esfera sem emenda atribuída não monta o bloco: não há o que ler, e o
// card acima já diz isso.
//
// O consumidor passa `key={`${municipioId}:${esfera}`}`: trocar um ou outro
// descarta a análise anterior em vez de deixá-la sob números que não são os dela.

import { useMemo } from 'react'
import AnalysisBlock, { type AnalysisBlockLabels } from '@/components/analysis/AnalysisBlock'
import { resourcesContent } from '@/data/home/resources'
import type { AiTaskRequest } from '@/types/ai'
import type { EmendaEsfera, EmendasData } from '@/types/emendas'
import { emendasAiSummary } from '@/utils/emendas'

interface EmendasAnalysisProps {
  data: EmendasData
  esfera: EmendaEsfera
  municipality: { id: string; name: string }
  className?: string
}

export default function EmendasAnalysis({
  data,
  esfera,
  municipality,
  className = '',
}: EmendasAnalysisProps) {
  const textos = resourcesContent.analise
  const labels: AnalysisBlockLabels = {
    emptyTitle: textos.titulo[esfera],
    emptySubtitle: textos.subtitulo,
    title: textos.rotulo,
    generate: textos.gerar,
    regenerate: textos.gerarNovamente,
    generating: textos.gerando,
  }

  const resumo = useMemo(
    () => emendasAiSummary(data, municipality.id, [esfera]),
    [data, municipality.id, esfera],
  )

  const request: AiTaskRequest | null =
    resumo === ''
      ? null
      : {
          task: 'emendas-analysis',
          municipality: { id: municipality.id, name: municipality.name },
          esfera,
          emendasSummary: resumo,
        }

  return <AnalysisBlock request={request} labels={labels} className={className} />
}
