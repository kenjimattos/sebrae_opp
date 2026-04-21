import { useEffect, useState } from 'react'

interface UseTypewriterOptions {
  text: string
  enabled: boolean
  speed?: number
  onDone?: () => void
}

// Revela `text` caractere a caractere enquanto `enabled` for true. Para
// resetar/reiniciar a animação, monte o componente consumidor com uma nova
// `key` — isso é mais previsível do que sincronizar reset via props.
export function useTypewriter({ text, enabled, speed = 18, onDone }: UseTypewriterOptions): {
  displayed: string
} {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    if (!enabled) return

    let index = 0
    const id = window.setInterval(() => {
      index += 1
      setDisplayed(text.slice(0, index))
      if (index >= text.length) {
        window.clearInterval(id)
        onDone?.()
      }
    }, speed)

    return () => window.clearInterval(id)
  }, [text, enabled, speed, onDone])

  return { displayed }
}
