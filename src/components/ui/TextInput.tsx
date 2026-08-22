// Figma: TextInput (603:2011)
// Variantes do Figma (title/subtitle/hint/active/disabled) expressas como props booleanas
// ao invés de enum. multiline renderiza <textarea>.

import { useId } from 'react'

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  title?: string
  subtitle?: string
  hint?: string
  disabled?: boolean
  multiline?: boolean
  rows?: number
  className?: string
}

export default function TextInput({
  value,
  onChange,
  title,
  subtitle,
  hint,
  disabled = false,
  multiline = false,
  rows = 4,
  className = '',
}: TextInputProps) {
  const id = useId()

  const fieldClasses = [
    'w-full typo-body px-sm py-xs border border-solid',
    disabled
      ? 'bg-surface-secondary border-surface-secondary cursor-not-allowed'
      : 'bg-background border-surface-secondary',
    'focus:outline-none focus:border-text-primary',
    'placeholder:text-inactive',
  ].join(' ')

  return (
    <div className={`flex flex-col items-start gap-xs w-full ${className}`}>
      {title && (
        <label htmlFor={id} className="typo-body-bold">
          {title}
        </label>
      )}
      {subtitle && <p className="typo-body-sm">{subtitle}</p>}
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hint}
          disabled={disabled}
          rows={rows}
          className={`${fieldClasses} resize-none`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hint}
          disabled={disabled}
          className={fieldClasses}
        />
      )}
    </div>
  )
}
