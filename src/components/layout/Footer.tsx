// Figma: Footer (419:917)
// Brand + 3 link columns + divider + copyright

import { footerColumns, brandText, copyright } from '@/data/layout'

export default function Footer({ className = '' }: { className?: string }) {
  return (
    <footer
      className={`bg-surface px-gutter py-2xl ${className}`}
    >
      <div className="flex items-start mx-auto w-full max-w-[1440px] justify-between">
        {/* Brand */}
        <div className="flex flex-col gap-sm items-start">
          <img
            src="/assets/sebrae-logo.png"
            alt="Sebrae"
            className="h-[60px] w-[111px] object-cover"
          />
          <h3 className="typo-h3">
            {brandText.name}
          </h3>
          <p className="typo-body whitespace-pre-line">
            {brandText.tagline}
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
      <div className="flex flex-col mx-auto w-full max-w-[1440px] gap-lg items-start mt-[var(--spacing-lg)] pb-2xl">
        <div className="divider" />
        <p className="typo-body">
          {copyright}
        </p>
      </div>
    </footer>
  )
}
