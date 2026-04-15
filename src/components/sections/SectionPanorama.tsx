// Figma: Section/Panorama (390:578)
// Mapa com seletor de indicadores da agenda + média + legenda de status

import { useState, useMemo } from 'react'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionCard from '@/components/ui/SectionCard'
import SectionHeader from '@/components/SectionHeader'
import Dropdown from '@/components/ui/Dropdown'
import ParaibaMap from '@/components/ParaibaMap'
import PanoramaLegend from '@/components/panorama/PanoramaLegend'
import PanoramaMediaInfo from '@/components/panorama/PanoramaMediaInfo'
import { useMunicipio } from '@/hooks/useMunicipio'
import { sectionContent } from '@/data/sections'
import {
  indicadorOptions,
  labelToKey,
  municipiosMapData,
  type IndicadorKey,
} from '@/data/mapa-indicadores'

export default function SectionPanorama() {
  const { municipio } = useMunicipio()
  const [indicador, setIndicador] = useState<IndicadorKey>('governanca_cfa')

  // Opções do dropdown derivadas das agendas do município
  const dropdownOptions = useMemo(() => {
    if (!municipio.dados) return indicadorOptions.map((o) => ({ label: o.shortLabel, value: o.value }))
    const options: { label: string; value: string }[] = []
    for (const agenda of municipio.dados.agendas) {
      for (const ind of agenda.indicadores) {
        const key = labelToKey[ind.label]
        if (key) {
          const opt = indicadorOptions.find((o) => o.value === key)
          if (opt) options.push({ label: opt.shortLabel, value: opt.value })
        }
      }
    }
    return options.length > 0 ? options : indicadorOptions.map((o) => ({ label: o.shortLabel, value: o.value }))
  }, [municipio.dados])

  // Média numérica do indicador selecionado (quando possível)
  const mediaInfo = useMemo(() => {
    const valores: number[] = []
    for (const data of Object.values(municipiosMapData)) {
      const entry = data.indicadores[indicador]
      if (entry?.valorNumerico !== undefined) {
        valores.push(entry.valorNumerico)
      }
    }
    if (valores.length === 0) return null
    const soma = valores.reduce((acc, v) => acc + v, 0)
    const media = soma / valores.length

    // Formatar baseado no tipo de indicador
    const opt = indicadorOptions.find((o) => o.value === indicador)
    const label = opt?.shortLabel ?? ''

    // Detectar formato pelo valor de exemplo
    const exemplo = Object.values(municipiosMapData)[0]?.indicadores[indicador]?.valor ?? ''
    let formatted: string
    if (exemplo.includes('%')) {
      formatted = `${media.toFixed(1)}%`
    } else if (exemplo.includes('R$')) {
      formatted = `R$ ${Math.round(media).toLocaleString('pt-BR')}`
    } else if (exemplo.includes(',') && !exemplo.includes('.') && media < 10) {
      formatted = media.toFixed(3).replace('.', ',')
    } else if (media < 100) {
      formatted = media.toFixed(1).replace('.', ',')
    } else {
      formatted = Math.round(media).toLocaleString('pt-BR')
    }

    return { label, formatted, count: valores.length }
  }, [indicador])

  return (
    <SectionContainer>
      <SectionHeader
        title={sectionContent.panorama.title}
        description={sectionContent.panorama.description}
      />

      <SectionCard padding="md" className="flex flex-col gap-md">
        {/* Header: label + dropdown */}
        <div className="flex-between">
          <span className="typo-body-bold">
            Indicador no mapa
          </span>
          <Dropdown
            options={dropdownOptions}
            value={indicador}
            onChange={(v) => setIndicador(v as IndicadorKey)}
            className="w-[240px]"
          />
        </div>

        {mediaInfo && (
          <PanoramaMediaInfo count={mediaInfo.count} formatted={mediaInfo.formatted} />
        )}

        <PanoramaLegend />

        <ParaibaMap
          selectedId={municipio.id}
          indicador={indicador}
        />
      </SectionCard>
    </SectionContainer>
  )
}
