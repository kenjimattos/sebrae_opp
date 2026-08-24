import { useCallback, useRef, useState } from 'react'

interface Undoable<T> {
  /** Verdadeiro entre uma geração bem-sucedida e o desfazer/próxima edição. */
  canUndo: boolean
  /** Guarda o valor atual antes de a IA sobrescrever, e esconde o desfazer. */
  capture: (value: T) => void
  /** Libera o "Desfazer" — chamar só quando a geração deu certo. */
  arm: () => void
  /** Devolve o valor guardado (ou null) e esconde o desfazer. */
  undo: () => T | null
  /** Esconde o desfazer sem restaurar (o usuário editou à mão). */
  reset: () => void
}

/**
 * O par "guarda o anterior / mostra Desfazer" que toda geração por IA do
 * Formulador repetia como `previousRef` + `showUndo` soltos. Fonte única
 * porque a ordem entre guardar e esconder é fácil de trocar sem querer, e o
 * sintoma — um Desfazer que restaura a geração anterior em vez do texto do
 * gestor — só aparece na segunda geração seguida.
 */
export function useUndoable<T>(): Undoable<T> {
  const previous = useRef<T | null>(null)
  const [canUndo, setCanUndo] = useState(false)

  const capture = useCallback((value: T) => {
    previous.current = value
    setCanUndo(false)
  }, [])

  const arm = useCallback(() => setCanUndo(true), [])

  const undo = useCallback(() => {
    setCanUndo(false)
    return previous.current
  }, [])

  const reset = useCallback(() => setCanUndo(false), [])

  return { canUndo, capture, arm, undo, reset }
}
