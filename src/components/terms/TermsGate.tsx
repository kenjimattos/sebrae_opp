import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import TermsDocument from '@/components/terms/TermsDocument'
import Button from '@/components/ui/buttons/Button'
import { fetchTermsAcceptance, postTermsAcceptance } from '@/data/api'
import { useAuth } from '@/hooks/useAuth'
import type { TermsAcceptance } from '@/types/terms'

type State =
  | { status: 'loading' }
  | { status: 'error'; detail: string }
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
      .catch((e: unknown) =>
        setState({ status: 'error', detail: e instanceof Error ? e.message : 'erro desconhecido' }),
      )
  }, [])

  useEffect(load, [load])

  async function accept(version: string) {
    setSaving(true)
    setFailed(false)
    try {
      const acceptance = await postTermsAcceptance(version)
      setState({ status: 'ready', acceptance })
      // O gate troca o conteúdo no lugar, na mesma rota (/home), e o ScrollToTop só age
      // em mudança de rota: sem isto a Home abria na posição de rolagem do documento
      // dos termos, no meio da página.
      window.scrollTo({ top: 0, left: 0 })
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  // Texto, não `null`: um null deixava a página em branco enquanto a API não respondia,
  // sem pista de que algo estava acontecendo.
  if (state.status === 'loading') {
    return (
      <div role="status" className="section-container py-xl typo-body">
        Verificando os termos de uso…
      </div>
    )
  }
  if (state.status === 'ready' && state.acceptance.accepted) return <Outlet />

  // Falha ao verificar: tela pequena, sem o texto — não há o que aceitar ainda.
  if (state.status === 'error') {
    return (
      <div className="section-container py-xl">
        <div className="max-w-xl mx-auto glass rounded p-lg flex flex-col gap-md">
          <h1 className="typo-h3">Não foi possível continuar</h1>
          <p role="alert" className="typo-body">
            Não conseguimos verificar o aceite dos termos de uso agora. Tente novamente em instantes.
          </p>
          {/* O status da API ("respondeu 401") é o que diferencia login recusado de servidor
              fora; sem ele a tela só diz que falhou. Não leva dado de usuário. */}
          <p className="typo-body-sm">Detalhe técnico: {state.detail}</p>
          <div className="flex gap-sm">
            <Button label="Tentar de novo" onClick={load} />
            <Button label="Sair" variant="secondary" onClick={logout} />
          </div>
        </div>
      </div>
    )
  }

  // O aceite fica na mesma tela do texto, numa barra que acompanha a rolagem: quem
  // aceita está diante dos termos, sem ir a outra aba.
  return (
    <div className="section-container py-xl">
      <TermsDocument>
        {/* `card-raised` (opaco), não `glass`: sobre texto que rola por baixo, o vidro deixava
            as linhas do documento aparecendo atrás do checkbox. */}
        <div className="sticky bottom-xs z-30 card-raised p-md flex flex-col gap-sm">
          {failed && (
            <p role="alert" className="typo-body-sm text-alert">
              Não foi possível registrar o aceite. Tente novamente.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-md">
            <label className="flex items-start gap-sm typo-body cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-2xs accent-accent"
              />
              <span>Li e aceito os termos de uso e o aviso de privacidade.</span>
            </label>
            <div className="flex gap-sm">
              <Button
                label="Aceitar e continuar"
                disabled={!agreed || saving}
                onClick={() => void accept(state.acceptance.version)}
              />
              <Button label="Recusar e sair" variant="secondary" onClick={logout} />
            </div>
          </div>
        </div>
      </TermsDocument>
    </div>
  )
}
