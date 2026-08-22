// Tema tri-estado: 'auto' segue o sistema, 'light'/'dark' são escolha explícita.
//
// A distinção importa: quem escolhe 'auto' quer acompanhar o sistema para sempre,
// inclusive quando ele mudar no meio da sessão (agendamento noturno do SO) — por
// isso o listener do matchMedia. Guardar só o tema resolvido perderia essa
// intenção na primeira troca.
//
// Persistência: `auto` é a AUSÊNCIA da chave, não o valor "auto". Assim o default
// de quem nunca escolheu e o de quem voltou para 'auto' são o mesmo estado, e o
// script anti-FOUC do index.html só precisa ler uma chave para decidir.
//
// Estado local, não contexto: o efeito do tema é a classe no <html>, global por
// natureza, e o único consumidor é o ThemeToggle. Dois consumidores montados ao
// mesmo tempo aplicariam o tema certo, mas cada um com seu estado de preferência
// — se isso acontecer, promover para provider antes de multiplicar o hook.

import { useCallback, useEffect, useState } from 'react'

export type ThemePreference = 'auto' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

// Ordem do ciclo do controle: começa no automático e passa pelos dois manuais.
export const THEME_CYCLE: readonly ThemePreference[] = ['auto', 'light', 'dark']

export const THEME_LABELS: Record<ThemePreference, string> = {
  auto: 'Tema: automático (segue o sistema)',
  light: 'Tema: claro',
  dark: 'Tema: escuro',
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'auto'
  } catch {
    // Modo privativo / storage bloqueado: cai no automático.
    return 'auto'
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches
}

// Efeito único do tema em todo o app: a classe `dark` no <html>, que liga o
// bloco .dark do index.css. Nenhum componente precisa saber o tema.
function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)
  // O que o sistema pede agora. Só muda pelo listener; o tema efetivo sai daqui
  // por derivação no render, não por um segundo estado espelhando o primeiro.
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  const resolved: ResolvedTheme = preference === 'auto' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  useEffect(() => {
    // Só o modo automático escuta o sistema; nos manuais o listener seria ruído.
    if (preference !== 'auto') return

    const media = window.matchMedia(DARK_QUERY)
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    try {
      if (next === 'auto') localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Sem persistência a escolha vale só para esta sessão — melhor que quebrar.
    }
  }, [])

  const cycleTheme = useCallback(() => {
    setPreference(THEME_CYCLE[(THEME_CYCLE.indexOf(preference) + 1) % THEME_CYCLE.length])
  }, [preference, setPreference])

  return { preference, resolved, setPreference, cycleTheme }
}
