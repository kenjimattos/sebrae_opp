import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
      // Parâmetro prefixado com `_` = deliberadamente não usado (ex.: assinatura
      // preservada por contrato, como `agendaStatus(_agenda)`). Sem isto o
      // prefixo não significa nada para o linter.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Force all Lucide imports through @/components/icons (central registry).
      // Prevents regressions where consumers bypass the icons barrel.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react',
              message: "Import icons from '@/components/icons' instead of 'lucide-react' directly.",
            },
          ],
        },
      ],
      // Cor em arbitrary value. Toda cor semântica tem classe nativa no
      // tailwind.config; escrever `text-[color:var(--semantic-x)]` significa
      // que falta um mapeamento lá — a saída é adicioná-lo, não contornar.
      // Escopo deliberadamente estreito: pega só `[...var(--semantic|primitives)]`
      // e hex cru em classe, deixando passar os arbitrary de dimensão e o
      // `var()` dentro de gradiente/color-mix em style inline, que são legítimos.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\\[(color:)?var\\(--(semantic|primitives)/]',
          message: 'Cor em arbitrary value: use a classe nativa do tailwind.config (e adicione o token lá se faltar).',
        },
        {
          selector: 'TemplateElement[value.raw=/\\[(color:)?var\\(--(semantic|primitives)/]',
          message: 'Cor em arbitrary value: use a classe nativa do tailwind.config (e adicione o token lá se faltar).',
        },
        {
          selector: 'Literal[value=/-\\[#[0-9a-fA-F]{3,8}\\]/]',
          message: 'Hex cru em classe: cor nova entra como primitiva no index.css e sai como token semântico.',
        },
        {
          selector: 'TemplateElement[value.raw=/-\\[#[0-9a-fA-F]{3,8}\\]/]',
          message: 'Hex cru em classe: cor nova entra como primitiva no index.css e sai como token semântico.',
        },
      ],
    },
  },
  {
    // icons/index.ts is the ONLY file allowed to import from lucide-react
    files: ['src/components/icons/index.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
])
