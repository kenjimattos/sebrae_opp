// Carga horária como unidade de leitura do catálogo de trilhas.
//
// A duração é o único eixo numérico real dos cursos ("36 horas"), e é o que
// sustenta a identidade da página /trilhas: o medidor no pé de cada pôster e a
// textura de números do billboard saem daqui. Parsing tolerante — curso sem
// duração legível some do cálculo em vez de quebrar a soma.

import type { Course, Trail } from '@/data/home/training'

/** Extrai o número de horas de uma duração livre ("36 horas"). `null` se não houver número. */
export function parseHours(duration: string): number | null {
  const match = duration.match(/\d+/)
  return match ? Number(match[0]) : null
}

export interface TrailLoad {
  /** Soma das cargas dos cursos da trilha. */
  totalHours: number
  /** Maior carga da trilha — denominador do medidor de cada pôster. */
  maxHours: number
  courseCount: number
}

export function trailLoad(trail: Trail): TrailLoad {
  const hours = trail.courses.map((c) => parseHours(c.duration)).filter((h): h is number => h !== null)
  return {
    totalHours: hours.reduce((sum, h) => sum + h, 0),
    maxHours: hours.length ? Math.max(...hours) : 0,
    courseCount: trail.courses.length,
  }
}

export interface CatalogLoad {
  trailCount: number
  courseCount: number
  totalHours: number
}

export function catalogLoad(trails: Trail[]): CatalogLoad {
  const allHours = trails.flatMap((t) =>
    t.courses.map((c) => parseHours(c.duration)).filter((h): h is number => h !== null),
  )
  return {
    trailCount: trails.length,
    courseCount: trails.reduce((sum, t) => sum + t.courses.length, 0),
    totalHours: allHours.reduce((sum, h) => sum + h, 0),
  }
}

/** Fração 0..1 da carga de um curso frente à maior carga da trilha. Piso visível de 8%. */
export function loadRatio(course: Course, maxHours: number): number {
  const hours = parseHours(course.duration)
  if (hours === null || maxHours <= 0) return 0
  return Math.max(0.08, Math.min(1, hours / maxHours))
}

/** "869" → "869" · "1200" → "1.200" (pt-BR, sem depender de locale do runtime). */
export function formatHours(hours: number): string {
  return hours.toLocaleString('pt-BR')
}
