// Carregado só pelo projeto `client` (ver vite.config.ts).
//
// Estende o `expect` do Vitest com os matchers de DOM (toBeInTheDocument,
// toBeDisabled…) e desmonta o que cada teste renderizou.
//
// A limpeza é registrada à mão de propósito: o Testing Library só a instala
// sozinho quando `globals: true`, e o projeto importa `describe`/`it`/`expect`
// explicitamente. Sem esta linha, o DOM de um teste sobrevive no seguinte e as
// buscas falham com "multiple elements found" — que parece bug do componente.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)
