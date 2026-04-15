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
      className={`bg-[var(--semantic-surface-primary)] px-margin py-2xl ${className}`}
    >
      <div className="flex items-start justify-between">
        {/* Brand */}
        <div className="flex flex-col gap-sm items-start">
          <img
            src="/assets/sebrae-logo.png"
            alt="Sebrae"
            className="h-[60px] w-[111px] object-cover"
          />
          <h3 className="typo-h3">
            Plataforma OPP
          </h3>
          <p className="typo-body">
            Transformando dados em
            <br />
            decisões estratégicas.
          </p>
        </div>

        {/* Link columns */}
        {footerColumns.map((col) => (
          <div key={col.title} className="flex flex-col gap-sm items-start">
            <span className="typo-body-bold">
              {col.title}
            </span>
            {col.links.map((link) => (
              <a
                key={link}
                href="#"
                className="typo-body no-underline transition-colors hover:text-accent"
              >
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="flex flex-col gap-lg items-start mt-[var(--spacing-lg)] pb-2xl">
        <div className="divider-primary" />
        <p className="typo-body">
          © 2025 Plataforma. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
