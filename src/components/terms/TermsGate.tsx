import { useCallback, useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import Button from '@/components/ui/buttons/Button'
import { fetchTermsAcceptance, postTermsAcceptance } from '@/data/api'
import { useAuth } from '@/hooks/useAuth'
import type { TermsAcceptance } from '@/types/terms'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; acceptance: TermsAcceptance }

// Fica dentro do RequireAuth: quem chega aqui já está logado. Sem aceite da versão
// vigente dos termos, a tela de aceite toma o lugar da rota. Recusar é sair.
// O aceite é do servidor (por usuário), não do navegador: vale em qualquer
// máquina, serve de comprovante e uma versão nova pede aceite de novo.
export default function TermsGate() {
  const { logout } = useAuth()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [agreed, setAgreed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    setState({ status: 'loading' })
    fetchTermsAcceptance()
      .then((acceptance) => setState({ status: 'ready', acceptance }))
      .catch(() => setState({ status: 'error' }))
  }, [])

  useEffect(load, [load])

  async function accept(version: string) {
    setSaving(true)
    setFailed(false)
    try {
      const acceptance = await postTermsAcceptance(version)
      setState({ status: 'ready', acceptance })
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  if (state.status === 'loading') return null
  if (state.status === 'ready' && state.acceptance.accepted) return <Outlet />

  return (
    <div className="section-container py-xl">
      <div className="max-w-xl mx-auto glass rounded p-lg flex flex-col gap-md">
        {state.status === 'error' ? (
          <>
            <h1 className="typo-h3">Não foi possível continuar</h1>
            <p role="alert" className="typo-body">
              Não conseguimos verificar o aceite dos termos de uso agora. Tente novamente em instantes.
            </p>
            <div className="flex gap-sm">
              <Button label="Tentar de novo" onClick={load} />
              <Button label="Sair" variant="secondary" onClick={logout} />
            </div>
          </>
        ) : (
          <>
            <h1 className="typo-h3">Termos de uso</h1>
            <p className="typo-body">
              Para usar a PIPPA, leia e aceite os termos de uso e o aviso de privacidade.
            </p>
            <Link
              to="/termos"
              target="_blank"
              rel="noopener"
              className="typo-body underline w-fit rounded-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Ler os termos de uso (abre em nova aba)
            </Link>
            <label className="flex items-start gap-sm typo-body cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-2xs accent-accent"
              />
              <span>Li e aceito os termos de uso e o aviso de privacidade.</span>
            </label>
            {failed && (
              <p role="alert" className="typo-body-sm text-alert">
                Não foi possível registrar o aceite. Tente novamente.
              </p>
            )}
            <div className="flex gap-sm">
              <Button
                label="Aceitar e continuar"
                disabled={!agreed || saving}
                onClick={() => void accept(state.acceptance.version)}
              />
              <Button label="Recusar e sair" variant="secondary" onClick={logout} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
