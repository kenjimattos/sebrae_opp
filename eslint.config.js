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
