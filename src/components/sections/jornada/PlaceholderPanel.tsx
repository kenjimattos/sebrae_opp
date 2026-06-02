// Placeholder das abas da Jornada ainda não construídas.

export default function PlaceholderPanel({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-sm">
      <h2 className="typo-h2 uppercase">{label}</h2>
      <p className="typo-body-sm">Em breve.</p>
    </div>
  )
}
