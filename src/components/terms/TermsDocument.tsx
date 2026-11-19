import type { ReactNode } from 'react'
import {
  A_CONFIRMAR,
  TERMS_INTRO,
  TERMS_SECTIONS,
  TERMS_SUMMARY,
  TERMS_TITLE,
  termsSectionId,
} from '@/data/terms/content'
import { TERMS_VERSION } from '@/data/terms/version'
import TermsToc from '@/components/terms/TermsToc'

// Trecho que o Sebrae ainda precisa preencher: realçado para o rascunho não ir a
// produção sem ser notado. Os demais trechos passam inteiros.
function withPending(text: string): ReactNode {
  if (!text.includes(A_CONFIRMAR)) return text
  const parts = text.split(A_CONFIRMAR)
  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <mark key={i} className="bg-transparent text-warning border-b border-warning">
            {A_CONFIRMAR}
          </mark>,
          part,
        ],
  )
}

interface TermsDocumentProps {
  /** Vai depois do texto, ainda dentro da coluna de leitura (ex.: barra de aceite). */
  children?: ReactNode
  className?: string
}

// O texto dos termos. Compartilhado pela página pública /termos e pela tela de
// aceite, para as duas mostrarem sempre a mesma coisa. Índice à esquerda, texto numa
// coluna de 64 caracteres, 96 a partir de `xl` e 112 a partir de `2xl` (passar de ~80
// cansa em monoespaçada; a largura maior foi pedida de propósito para telas grandes).
//
// A largura é a da TRILHA do grid (`minmax(0,Nch)`) e o grid centraliza o conjunto
// índice + texto (`justify-center`). Com `1fr` a trilha ocupava todo o espaço, e o texto,
// limitado por `max-w`, ficava colado à esquerda com o resto da tela vazio. `w-full` é
// necessário: o `section-container` centraliza os filhos e sem ele o grid encolheria.
export default function TermsDocument({ children, className = '' }: TermsDocumentProps) {
  return (
    <div
      className={`w-full grid gap-lg lg:grid-cols-[240px_minmax(0,64ch)] xl:grid-cols-[240px_minmax(0,96ch)] 2xl:grid-cols-[240px_minmax(0,112ch)] lg:justify-center lg:gap-xl items-start ${className}`}
    >
      <TermsToc
        sections={TERMS_SECTIONS}
        className="lg:sticky lg:top-[calc(var(--header-h)+var(--spacing-md))]"
      />

      <div className="flex flex-col gap-xl">
        <div className="w-full max-w-[64ch] mx-auto lg:max-w-none flex flex-col gap-xl">
          <header className="flex flex-col gap-sm">
            <h1 className="typo-h2">{TERMS_TITLE}</h1>
            <p className="typo-body-sm">Versão {TERMS_VERSION}</p>
            <p className="typo-body leading-relaxed">{TERMS_INTRO}</p>
          </header>

          <section aria-labelledby="termos-resumo" className="glass rounded p-md flex flex-col gap-sm">
            <h2 id="termos-resumo" className="typo-title-sm">
              Em resumo
            </h2>
            <ul className="list-disc pl-md flex flex-col gap-xs typo-body leading-relaxed">
              {TERMS_SUMMARY.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          {TERMS_SECTIONS.map((section, index) => (
            <section
              key={section.id}
              id={termsSectionId(section.id)}
              aria-labelledby={`${termsSectionId(section.id)}-titulo`}
              // A última seção é curta: sem altura mínima a página acaba antes de o
              // topo dela subir até a linha do índice, e ele nunca a marcaria (nem a
              // penúltima). Com a altura da tela menos o header, o topo dela alcança
              // o header no fim da rolagem. Mesmo recurso da última fileira de /trilhas.
              className={`flex flex-col gap-sm ${
                index === TERMS_SECTIONS.length - 1 ? 'min-h-[calc(100dvh-var(--header-h))]' : ''
              }`}
            >
              <h2 id={`${termsSectionId(section.id)}-titulo`} className="typo-title-md">
                {section.title}
              </h2>
              {section.paragraphs.map((text) => (
                <p key={text} className="typo-body leading-relaxed">
                  {withPending(text)}
                </p>
              ))}
              {section.items && (
                <ul className="list-disc pl-md flex flex-col gap-xs typo-body leading-relaxed">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* Dentro da coluna de leitura, para a barra de aceite ter a largura do texto. */}
          {children}
        </div>
      </div>
    </div>
  )
}
