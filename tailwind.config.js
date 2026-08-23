/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      spacing: {
        '2xs': 'var(--spacing-2xs)',     // 4px
        'xs':  'var(--spacing-xs)',      // 8px
        'sm':  'var(--spacing-sm)',      // 12px
        'md':  'var(--spacing-md)',      // 24px
        'lg':  'var(--spacing-lg)',      // 40px
        'xl':  'var(--spacing-xl)',      // 48px
        '2xl': 'var(--spacing-2xl)',     // 64px
        '3xl': 'var(--spacing-3xl)',     // 96px
        'gutter': 'var(--spacing-gutter)', // 180px
      },
      borderWidth: {
        DEFAULT: '0.5px',
      },
      borderColor: {
        'surface':           'var(--semantic-surface-primary)',
        'surface-secondary': 'var(--semantic-surface-secondary)',
        'surface-tertiary':  'var(--semantic-surface-tertiary)',
        'accent':            'var(--semantic-accent)',
        'text-primary':      'var(--semantic-text-primary)',
        'success':           'var(--semantic-success)',
        'warning':           'var(--semantic-warning)',
        'alert':             'var(--semantic-alert)',
      },
      borderRadius: {
        'sm':   'var(--radius-sm)',   // 12px
        'md':   'var(--radius-md)',   // 24px
        'lg':   'var(--radius-lg)',   // 32px
        'xl':   'var(--radius-xl)',   // 48px
        // rounded-full mantém o default do Tailwind (9999px) para círculos perfeitos
      },
      backgroundColor: {
        'surface':           'var(--semantic-surface-primary)',
        'surface-secondary': 'var(--semantic-surface-secondary)',
        'surface-tertiary':  'var(--semantic-surface-tertiary)',
        'accent':            'var(--semantic-accent)',
        'accent-hover':      'var(--semantic-accent-hover)',
        'success':           'var(--semantic-success)',
        'accent-surface':    'var(--semantic-accent-surface)',
        'background':        'var(--semantic-background)',
        'success-surface':   'var(--semantic-success-surface)',
        'warning-surface':   'var(--semantic-warning-surface)',
        'alert-surface':     'var(--semantic-alert-surface)',
        'button-primary':    'var(--semantic-button-primary)',
        'button-secondary':  'var(--semantic-button-secondary)',
        'button-tertiary':   'var(--semantic-button-tertiary)',
        // Pares de label expostos como fundo: o PillButton inverte
        // deliberadamente bg/texto no círculo da seta.
        'button-label-primary':   'var(--semantic-button-label-primary)',
        'button-label-secondary': 'var(--semantic-button-label-secondary)',
      },
      outlineColor: {
        'accent': 'var(--semantic-accent)',
      },
      textColor: {
        'primary':   'var(--semantic-text-primary)',
        'on-accent': 'var(--semantic-text-on-accent)',
        'inactive':  'var(--semantic-text-inactive)',
        'accent':    'var(--semantic-accent)',
        'success':   'var(--semantic-success)',
        'warning':   'var(--semantic-warning)',
        'alert':     'var(--semantic-alert)',
        'button-primary':          'var(--semantic-button-primary)',
        'button-label-primary':    'var(--semantic-button-label-primary)',
        'button-label-secondary':  'var(--semantic-button-label-secondary)',
        'button-label-tertiary':   'var(--semantic-button-label-tertiary)',
        'button-label-success':    'var(--semantic-button-label-success)',
      },
      container: {
        center: true,
        screens: { '2xl': '1900px' },
      }
    },
  },
  plugins: [],
}
