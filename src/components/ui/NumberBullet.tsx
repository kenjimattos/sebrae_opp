// Tailwind pure — no Figma equivalent
// Bullet numérico circular para listas ordenadas / outlines / resumos.
// Variantes compõem bg + cor de texto; o número é renderizado com `.typo-body-sm-bold`
// (secondary herda a cor padrão da classe; primary sobrescreve para branco).

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
  // Fundo accent (azul) + número branco — usado para destaque / passos ativos
  primary:
    'bg-accent text-[color:var(--semantic-text-secondary)]',
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
      className={`inline-flex items-center justify-center shrink-0 radius-full typo-body-sm-bold ${sizeClass[size]} ${variantClass[variant]} ${className}`}
    >
      {value}
    </span>
  )
}
