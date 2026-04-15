// Status legend for the Panorama map section

export default function PanoramaLegend() {
  return (
    <div className="flex-center gap-md">
      <div className="flex-center gap-2xs">
        <span className="w-[12px] h-[12px] rounded-full status-success-bg border border-[var(--semantic-success)]" />
        <span className="typo-body-sm text-inactive">Bom</span>
      </div>
      <div className="flex-center gap-2xs">
        <span className="w-[12px] h-[12px] rounded-full status-warning-bg border border-[var(--semantic-warning)]" />
        <span className="typo-body-sm text-inactive">Atenção</span>
      </div>
      <div className="flex-center gap-2xs">
        <span className="w-[12px] h-[12px] rounded-full status-alert-bg border border-[var(--semantic-alert)]" />
        <span className="typo-body-sm text-inactive">Crítico</span>
      </div>
    </div>
  )
}
