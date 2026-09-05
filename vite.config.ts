/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { handleAiTask } from './api/_lib/handler'

// Endpoint de IA em dev: mesmo handler que a function da Vercel (api/ai.ts),
// uma única fonte de verdade. Registrado direto no configureServer (não em
// hook pós-interno) para rodar ANTES do proxy /api → :3000 — senão o proxy
// engoliria o POST /api/ai. Chave em .env.local (sem prefixo VITE_).
function aiDevEndpoint(env: Record<string, string>): Plugin {
  return {
    name: 'ai-dev-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/ai', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Método não permitido.', code: 'bad_request' }))
          return
        }
        let raw = ''
        req.on('data', (chunk: Buffer) => {
          raw += chunk.toString()
        })
        req.on('end', () => {
          let body: unknown
          try {
            body = raw === '' ? undefined : JSON.parse(raw)
          } catch {
            body = undefined // handler devolve 400
          }
          void handleAiTask(body, {
            apiKey: env.OPENROUTER_API_KEY,
            model: env.OPENROUTER_MODEL,
          }).then(({ status, body: out }) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(out))
          })
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefixo '' → carrega também vars sem VITE_ (só usadas aqui, no lado Node).
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), aiDevEndpoint(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Em dev, /api/municipalities* e /api/emendas são atendidos pelo snapshot em
    // public/api-snapshot (mesmos rewrites do vercel.json) — funciona sem a API
    // Node e sem acesso ao Mongo do Sebrae. O restante de /api/* segue no proxy
    // para a API Node (server/, porta 3000), como o Nginx faz em produção.
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          bypass(req) {
            const url = req.url?.split('?')[0] ?? ''
            if (url === '/api/municipalities') {
              return '/api-snapshot/municipalities.json'
            }
            const match = url.match(/^\/api\/municipalities\/([^/]+)$/)
            if (match) {
              return `/api-snapshot/municipalities/${match[1]}.json`
            }
            if (url === '/api/emendas') {
              return '/api-snapshot/emendas.json'
            }
          },
        },
      },
    },
    // Dois projetos de teste, um por ambiente, na mesma instalação do Vitest:
    // `tests/client` roda em jsdom (React, localStorage); `tests/server` roda
    // em node puro (services, status, api/_lib). Sem `globals`: describe/it/
    // expect são importados de 'vitest' em cada arquivo, porque o tsconfig
    // que cobre api/_lib só conhece os tipos de node.
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'client',
            environment: 'jsdom',
            include: ['tests/client/**/*.test.{ts,tsx}'],
            setupFiles: './tests/setup.ts',
            css: true,
          },
        },
        {
          extends: true,
          test: {
            name: 'server',
            environment: 'node',
            include: ['tests/server/**/*.test.ts'],
          },
        },
      ],
    },
  }
})
