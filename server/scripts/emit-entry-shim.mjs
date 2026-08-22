// Emite dist/index.js como um shim para dist/server/src/index.js.
//
// Por quê: o tsconfig do server usa `rootDir: ".."` para compilar o núcleo de IA
// compartilhado (api/_lib), que é fonte única com a function da Vercel e o
// middleware de dev do Vite. Isso empurra o entrypoint emitido de dist/index.js
// para dist/server/src/index.js — e o ExecStart da unit systemd em produção
// (10.1.100.99) aponta para o caminho antigo. Sem este shim, o próximo deploy
// derrubaria a API com "Cannot find module".
//
// Rodado como `postbuild`. Se um dia o ExecStart for atualizado para o caminho
// real, este arquivo e o script podem sair.
import { writeFileSync } from 'node:fs'

writeFileSync(
  new URL('../dist/index.js', import.meta.url),
  "// Gerado por scripts/emit-entry-shim.mjs — não editar.\nimport './server/src/index.js'\n",
)
