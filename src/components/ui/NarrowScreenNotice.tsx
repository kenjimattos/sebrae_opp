// Tailwind pure — no Figma equivalent
// Aviso para telas abaixo de 1000px, onde o layout desktop deixa de caber.
// Não bloqueia: zoom alto num notebook também cai aqui (1280px a 150% ≈ 850px
// para o CSS), e trancar essa pessoa fora seria barrar um aparelho que dá conta.
// Some sozinho ao passar de 1000px — quem diminui o zoom vê o aviso ir embora.

import { useState, useSyncExternalStore } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/buttons/Button'

const QUERY = '(max-width: 999px)'
const STORAGE_KEY = 'narrow-notice:dismissed'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const isNarrow = () => window.matchMedia(QUERY).matches

// localStorage pode lançar (aba privada, site data bloqueado): sem ele, o aviso
// só volta a aparecer na próxima visita, que é o comportamento aceitável.
function readDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export default function NarrowScreenNotice() {
  const narrow = useSyncExternalStore(subscribe, isNarrow)
  const [dismissed, setDismissed] = useState(readDismissed)

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ver readDismissed
    }
  }

  return (
    <Modal open={narrow && !dismissed} onClose={dismiss} title="Tela pequena para a PIPPA" maxWidth="max-w-[440px]">
      <div className="flex flex-col gap-md">
        <p className="typo-body">
          A PIPPA foi feita para telas a partir de 1000px de largura. Nesta tela, partes
          do conteúdo podem ficar desalinhadas ou cortadas.
        </p>
        <p className="typo-body">
          Se estiver no computador, diminua o zoom do navegador: <strong>Ctrl</strong> e{' '}
          <strong>−</strong> no Windows, <strong>⌘</strong> e <strong>−</strong> no Mac.
          Este aviso some sozinho quando a tela passa a caber.
        </p>
        <Button label="Continuar mesmo assim" onClick={dismiss} className="self-end" />
      </div>
    </Modal>
  )
}
