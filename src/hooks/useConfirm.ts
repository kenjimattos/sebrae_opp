import { createContext, useContext } from 'react'

export interface ConfirmOptions {
  title: string
  /** Uma frase dizendo o que se perde. Sem rodeio: a pessoa vai ler correndo. */
  message: string
  /** Rótulo do botão que segue em frente. Deve nomear a ação, não dizer "OK". */
  confirmLabel: string
  cancelLabel?: string
}

/** Abre a confirmação e resolve com a escolha. `false` também no Escape/backdrop. */
export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext)
  if (!confirm) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return confirm
}
