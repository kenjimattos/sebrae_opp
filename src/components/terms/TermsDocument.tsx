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
// aceite, para as duas mostrarem sempre a mesma coisa. Índice à esquerda, texto
// numa coluna de ~64 caracteres: monoespaçada em linha longa cansa a leitura.
// O `max-w` fica num filho sem padding (ver CLAUDE.md, armadilha do gutter).
export default function TermsDocument({ children, className = '' }: TermsDocumentProps) {
  return (
    <div className={`grid gap-lg lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-xl items-start ${className}`}>
      <TermsToc
        sections={TERMS_SECTIONS}
        className="lg:sticky lg:top-[calc(var(--header-h)+var(--spacing-md))]"
      />

      <div className="flex flex-col gap-xl">
        <div className="max-w-[64ch] flex flex-col gap-xl">
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

          {TERMS_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={termsSectionId(section.id)}
              aria-labelledby={`${termsSectionId(section.id)}-titulo`}
              className="flex flex-col gap-sm"
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
        </div>

        {children}
      </div>
    </div>
  )
}
