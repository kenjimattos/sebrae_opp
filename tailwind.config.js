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
      borderColor: {
        'surface': 'var(--semantic-surface-primary)',
        'accent':  'var(--semantic-accent)',
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
        'accent':            'var(--semantic-accent)',
        'primary':           'var(--semantic-background-primary)',
      },
      outlineColor: {
        'accent': 'var(--semantic-accent)',
      },
      textColor: {
        'inactive': 'var(--semantic-text-inactive)',
        'accent':   'var(--semantic-accent)',
      },
      container: {
        center: true,
        screens: { '2xl': '1900px' },
      }
    },
  },
  plugins: [],
}
