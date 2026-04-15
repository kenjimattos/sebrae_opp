// Tailwind pure — no Figma equivalent
// Section wrapper: max-w-[1440px] + padding lateral + flex column + gap + vertical padding

interface SectionContainerProps {
  children: React.ReactNode
  className?: string
}

export default function SectionContainer({ children, className = '' }: SectionContainerProps) {
  return (
    <section
      className={`section-container ${className}`}
    >
      {children}
    </section>
  )
}
