// Onde a Paraíba está entre as 27 UFs e entre as 9 do Nordeste.
//
// É o que ocupa, no grão estadual, o lugar que o semáforo ocupa no municipal — e
// por isso NÃO tem cor nenhuma: posição é comparação entre pares, não
// classificação de desempenho (ver src/types/estado.ts e CLAUDE.md). Uma classe
// de status aqui transformaria "25ª de 27" num vermelho que a fonte não endossa.

import { ordinalF, formatNumberBR, type StatePosition as Position } from '@/utils/estado'

interface StatePositionProps {
  position: Position
  className?: string
}

export default function StatePosition({ position, className = '' }: StatePositionProps) {
  const { entreUfs, totalUfs, entreNordeste, totalNordeste, normalizado, valorNormalizado, unidadeNormalizada } = position

  return (
    <p className={`typo-body-sm text-inactive ${className}`}>
      <span className="typo-body-sm-bold text-primary">{ordinalF(entreUfs)}</span> de {totalUfs} UFs
      {totalNordeste > 0 && (
        <>
          {' · '}
          <span className="typo-body-sm-bold text-primary">{ordinalF(entreNordeste)}</span> no Nordeste
        </>
      )}
      {/* O número que ordenou não é o exibido no card: contagem bruta mede o
          tamanho da UF, então a posição vem per capita. Dizer qual é evita a
          leitura de que a PB tem 219,7 empregos. */}
      {normalizado && valorNormalizado !== null && (
        <>
          <br />
          por {formatNumberBR(valorNormalizado)} {unidadeNormalizada} — a ordem é per capita
        </>
      )}
    </p>
  )
}
