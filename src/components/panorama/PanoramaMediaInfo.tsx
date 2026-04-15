// State average display for the selected indicator

interface PanoramaMediaInfoProps {
  count: number
  formatted: string
}

export default function PanoramaMediaInfo({ count, formatted }: PanoramaMediaInfoProps) {
  return (
    <div className="flex-center gap-sm">
      <span className="typo-body-sm text-inactive">
        Média estadual ({count} municípios):
      </span>
      <span className="typo-body-bold">
        {formatted}
      </span>
    </div>
  )
}
