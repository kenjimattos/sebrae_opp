// Onde a Paraíba está entre as 27 UFs e entre as 9 do Nordeste.
//
// É o que ocupa, no grão estadual, o lugar que o semáforo ocupa no municipal — e
// por isso NÃO tem cor nenhuma: posição é comparação entre pares, não
// classificação de desempenho (ver src/types/estado.ts e CLAUDE.md). Uma classe
// de status aqui transformaria "25ª de 27" num vermelho que a fonte não endossa.
// O destaque é só tipográfico: a colocação em corpo de título, o universo embaixo.

import { ordinalF, type StatePosition as Position } from '@/utils/estado'

interface StatePositionProps {
  position: Position
  className?: string
}

export default function StatePosition({ position, className = '' }: StatePositionProps) {
  const { entreUfs, totalUfs, entreNordeste, totalNordeste, normalizado } = position

  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      <div className="flex gap-sm">
        <p className="flex flex-col gap-2xs">
          <span className="typo-title-lg tabular-nums">{ordinalF(entreUfs)}</span>
          <span className="typo-body-sm text-inactive">de {totalUfs} UFs</span>
        </p>
        {totalNordeste > 0 && (
          <p className="flex flex-col gap-2xs border-l border-divider pl-sm">
            <span className="typo-title-lg tabular-nums">{ordinalF(entreNordeste)}</span>
            <span className="typo-body-sm text-inactive">de {totalNordeste} no Nordeste</span>
          </p>
        )}
      </div>
      {/* O número que ordenou não é o exibido no card: contagem bruta mede o
          tamanho da UF, então a posição vem per capita. O valor per capita saiu
          da tela, mas o rótulo fica — sem ele, "19ª" ao lado de "914.955" se lê
          como ranking por total. */}
      {normalizado && <p className="typo-body-sm text-inactive">Posição per capita</p>}
    </div>
  )
}
