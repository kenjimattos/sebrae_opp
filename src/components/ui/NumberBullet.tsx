// Tailwind pure — no Figma equivalent
// Bullet numérico circular para listas ordenadas / outlines / resumos.
// Variantes compõem bg + cor de texto; o número é renderizado com `.typo-body-sm-bold`
// (secondary herda a cor padrão da classe; primary sobrescreve para on-accent).

type NumberBulletVariant = 'primary' | 'secondary'
type NumberBulletSize = 'sm' | 'md'

interface NumberBulletProps {
  value: number | string
  variant?: NumberBulletVariant
  size?: NumberBulletSize
  className?: string
}

const sizeClass: Record<NumberBulletSize, string> = {
  sm: 'w-[24px] h-[24px]',
  md: 'w-[32px] h-[32px]',
}

const variantClass: Record<NumberBulletVariant, string> = {
  // Fundo accent + número na cor que o accent pede (branco no light, preto no
  // dark) — usado para destaque / passos ativos
  primary: 'bg-accent text-on-accent',
  // Fundo cinza claro — número herda text-primary da classe typo
  secondary: 'bg-surface-secondary',
}

export default function NumberBullet({
  value,
  variant = 'secondary',
  size = 'sm',
  className = '',
}: NumberBulletProps) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-full typo-body-sm-bold ${sizeClass[size]} ${variantClass[variant]} ${className}`}
    >
      {value}
    </span>
  )
}
