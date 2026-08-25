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
        // `border` (sem sufixo) = o traço fino. O mesmo token alimenta o padding
        // do `.glass::before`: ver o bloco BORDER no index.css.
        DEFAULT: 'var(--border-default)',
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
        // `rounded` (sem sufixo) = o raio de superfície. Só existe um, então não
        // leva nome de tamanho: `sm`/`md`/`lg` sugeririam uma escala que não há.
        DEFAULT: 'var(--radius-default)', // 12px — card, painel glass, modal
        'xs':    'var(--radius-xs)', // 2px  — micro-elementos
        // rounded-full mantém o default do Tailwind (9999px) para círculos perfeitos
        // Atenção: sufixo sem chave aqui NÃO vira erro — cai no default do
        // Tailwind (rounded-md = 6px). Raio fora de `rounded`/`xs`/`full` é engano.
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
        'button-secondary':        'var(--semantic-button-secondary)',
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
