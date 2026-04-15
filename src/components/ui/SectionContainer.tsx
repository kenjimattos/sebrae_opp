// Tailwind pure — no Figma equivalent
// Section wrapper: max-w-[1440px] + padding lateral + flex column + gap + vertical padding

interface SectionContainerProps {
  children: React.ReactNode
  className?: string
}

export default function SectionContainer({ children, className = '' }: SectionContainerProps) {
  return (
    <section
      className={`mx-auto w-full max-w-[1440px] px-margin flex flex-col gap-2xl py-lg ${className}`}
    >
      {children}
    </section>
  )
}
