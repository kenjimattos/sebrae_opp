// Confirmação única da aplicação, em promessa: `const ok = await confirm({...})`.
//
// Existe porque as ações que descartam texto do gestor estão espalhadas — quatro
// botões de IA que substituem conteúdo e quatro entradas de troca de município —
// e cada uma precisaria do seu próprio par de estado + modal. Aqui é um modal só,
// montado na raiz, e o chamador escreve uma linha.
//
// Fechar por Escape ou clique fora resolve `false`: o caminho de menor esforço
// tem de ser o que preserva o trabalho.
//
// Com `options.once`, o aviso é uma vez por sessão. Perguntar a cada clique num
// botão que a pessoa aperta o tempo todo não protege ninguém: vira o diálogo que
// se fecha no reflexo, e aí o aviso que importa também passa despercebido.

import { useCallback, useRef, useState, type ReactNode } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/buttons/Button'
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from '@/hooks/useConfirm'

export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  // A promessa fica pendente enquanto o modal está aberto; o resolver espera
  // aqui para ser chamado pelo botão, pelo Escape ou pelo clique fora.
  const resolveRef = useRef<((value: boolean) => void) | null>(null)
  // Chaves de `once` já aceitas nesta sessão. Ref, não estado: nada na tela
  // depende disso, e re-renderizar a árvore inteira por causa dela seria custo
  // sem efeito.
  const aceitas = useRef<Set<string>>(new Set())

  const settle = useCallback((value: boolean) => {
    setOptions((atual) => {
      if (value && atual?.once) aceitas.current.add(atual.once)
      return null
    })
    resolveRef.current?.(value)
    resolveRef.current = null
  }, [])

  const confirm = useCallback<ConfirmFn>((next) => {
    // Já avisado nesta sessão: segue em frente sem abrir o modal.
    if (next.once && aceitas.current.has(next.once)) return Promise.resolve(true)
    // Uma confirmação de cada vez: se outra estiver aberta, ela é recusada
    // antes de abrir a nova, para nenhuma promessa ficar pendurada.
    resolveRef.current?.(false)
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={options !== null}
        onClose={() => settle(false)}
        title={options?.title}
        maxWidth="max-w-[420px]"
      >
        <div className="flex flex-col gap-lg">
          <p className="typo-body">{options?.message}</p>
          <div className="flex items-center justify-end gap-xs">
            <Button
              label={options?.cancelLabel ?? 'Cancelar'}
              variant="tertiary"
              size="md"
              onClick={() => settle(false)}
            />
            <Button
              label={options?.confirmLabel ?? 'Continuar'}
              variant="primary"
              size="md"
              onClick={() => settle(true)}
            />
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}
