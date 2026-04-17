import TextInput from '@/components/ui/TextInput'
import { useFormulador } from '@/hooks/useFormulador'
import type { IndicadoresData } from '@/types/formulador'

type GrupoKey = keyof IndicadoresData

interface GrupoConfig {
  key: GrupoKey
  title: string
  subtitle: string
  placeholder: string
  labelPrefix: string    // usado quando não há texto de objetivo/indicador correspondente
}

const GRUPOS: GrupoConfig[] = [
  {
    key: 'resultado',
    title: 'Indicadores de Resultado',
    subtitle: '💡 Devem estar conectados aos objetivos definidos.',
    placeholder: 'Como medir se os objetivos foram alcançados',
    labelPrefix: 'Objetivo',
  },
  {
    key: 'impacto',
    title: 'Indicadores de Impacto',
    subtitle: '💡 Devem estar conectados aos indicadores definidos.',
    placeholder: 'Mudanças de longo prazo esperadas',
    labelPrefix: 'Indicador',
  },
  {
    key: 'quantitativas',
    title: 'Metas Quantitativas',
    subtitle: '💡 Devem estar conectados aos indicadores definidos.',
    placeholder: 'Principais marcos e entregas de cada fase',
    labelPrefix: 'Indicador',
  },
]

export default function StepIndicadores() {
  const { state, setSlice } = useFormulador()
  const data = state.indicadores
  const objetivos = state.objetivos.especificos

  const setCampo = (grupo: GrupoKey, idx: number, value: string) => {
    const arr = [...data[grupo]]
    // padronizar o tamanho caso o índice extrapole (quando o usuário adicionou
    // objetivos depois de salvar indicadores sem preencher todas as linhas)
    while (arr.length <= idx) arr.push('')
    arr[idx] = value
    setSlice('indicadores', { ...data, [grupo]: arr })
  }

  // Todos os 3 grupos são 1-para-1 com os objetivos específicos (etapa 3).
  // Cada linha é rotulada com o texto do objetivo correspondente (fallback "Objetivo N").
  const count = Math.max(1, objetivos.length)

  return (
    <div className="flex flex-col gap-md">
      {GRUPOS.map((grupo) => (
        <div key={grupo.key} className="flex flex-col gap-xs">
          <p className="typo-body-bold">{grupo.title}</p>
          <p className="typo-body-sm">{grupo.subtitle}</p>
          <div className="flex flex-col gap-sm">
            {Array.from({ length: count }).map((_, idx) => {
              const valor = data[grupo.key][idx] ?? ''
              const label = objetivos[idx]?.trim() || `${grupo.labelPrefix} ${idx + 1}`
              return (
                <div key={idx} className="flex flex-col gap-2xs">
                  <span className="typo-body-sm">{label}</span>
                  <TextInput
                    value={valor}
                    hint={grupo.placeholder}
                    onChange={(v) => setCampo(grupo.key, idx, v)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
