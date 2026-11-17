import { TERMS_INTRO, TERMS_SECTIONS, TERMS_TITLE } from '@/data/terms/content'
import { TERMS_VERSION } from '@/data/terms/version'

// O texto dos termos. Compartilhado pela página pública /termos e pela tela de
// aceite, para as duas mostrarem sempre a mesma coisa.
export default function TermsDocument({ className = '' }: { className?: string }) {
  return (
    <article className={`flex flex-col gap-lg ${className}`}>
      <header className="flex flex-col gap-xs">
        <h1 className="typo-h2">{TERMS_TITLE}</h1>
        <p className="typo-body-sm">Versão {TERMS_VERSION}</p>
        <p className="typo-body">{TERMS_INTRO}</p>
      </header>

      {TERMS_SECTIONS.map((section) => (
        <section key={section.id} aria-labelledby={`termos-${section.id}`} className="flex flex-col gap-sm">
          <h2 id={`termos-${section.id}`} className="typo-title-md">
            {section.title}
          </h2>
          {section.paragraphs.map((text) => (
            <p key={text} className="typo-body">
              {text}
            </p>
          ))}
          {section.items && (
            <ul className="list-disc pl-lg flex flex-col gap-xs typo-body">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  )
}
