// Figma: Footer (419:917)
// Brand + 3 link columns + divider + copyright

import { footerColumns, brandText, copyright } from '@/data/layout'

export default function Footer({ className = '' }: { className?: string }) {
  return (
    <footer className={`bg-surface py-2xl ${className}`}>
      <div className="container px-gutter flex flex-col gap-lg">
        {/* Top: brand + link columns */}
        <div className="flex items-start justify-between w-full">
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

        {/* Bottom: divider + copyright */}
        <div className="flex flex-col gap-lg items-start w-full">
          <div className="divider" />
          <p className="typo-body">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}
