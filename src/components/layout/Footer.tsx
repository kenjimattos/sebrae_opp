// Figma: Footer (419:917)
// Brand + 3 link columns + divider + copyright

const footerColumns = [
  {
    title: 'Navegação',
    links: ['Início', 'Panorama', 'Recursos', 'Capacitação'],
  },
  {
    title: 'Recursos',
    links: ['Documentação', 'Tutoriais', 'API', 'Suporte'],
  },
  {
    title: 'Contato',
    links: ['contato@plataforma.gov.br', 'Fale Conosco'],
  },
]

export default function Footer({ className = '' }: { className?: string }) {
  return (
    <footer
      className={`bg-[var(--semantic-surface-primary)] px-[var(--spacing-margin)] py-[var(--spacing-2xl)] ${className}`}
    >
      <div className="flex items-start justify-between">
        {/* Brand */}
        <div className="flex flex-col gap-[var(--spacing-sm)] items-start">
          <img
            src="/assets/sebrae-logo.png"
            alt="Sebrae"
            className="h-[60px] w-[111px] object-cover"
          />
          <h3 className="typo-h3 text-[color:var(--semantic-text-primary)]">
            Plataforma OPP
          </h3>
          <p className="typo-body text-[color:var(--semantic-text-primary)]">
            Transformando dados em
            <br />
            decisões estratégicas.
          </p>
        </div>

        {/* Link columns */}
        {footerColumns.map((col) => (
          <div key={col.title} className="flex flex-col gap-[var(--spacing-sm)] items-start">
            <span className="typo-body-bold text-[color:var(--semantic-text-primary)]">
              {col.title}
            </span>
            {col.links.map((link) => (
              <a
                key={link}
                href="#"
                className="typo-body text-[color:var(--semantic-text-primary)] no-underline transition-colors hover:text-[color:var(--semantic-accent)]"
              >
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="flex flex-col gap-[var(--spacing-lg)] items-start mt-[var(--spacing-lg)] pb-[var(--spacing-2xl)]">
        <div className="h-px w-full bg-[var(--semantic-text-primary)]" />
        <p className="typo-body text-[color:var(--semantic-text-primary)]">
          © 2025 Plataforma. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
