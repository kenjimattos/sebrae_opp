// Tailwind pure — no Figma equivalent
// Renderizador de markdown leve para respostas do LLM (chat, modal do
// indicador) — sem lib externa (regra do projeto). Suporta o subconjunto que
// o prompt permite: **negrito**, *itálico*, `código`, listas numeradas e com
// hífen, parágrafos. Títulos/tabelas ficam de fora de propósito.
// Tolerante a texto parcial (typewriter): marcador não fechado renderiza
// literal até o par chegar.

interface MarkdownLiteProps {
  text: string
  className?: string
}

type Block =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'ordered' | 'unordered'; items: string[] }

const ORDERED_RE = /^\s*\d+[.)]\s+/
const UNORDERED_RE = /^\s*[-*•]\s+/

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trimEnd()
    const last = blocks[blocks.length - 1]

    if (line.trim() === '') continue

    if (ORDERED_RE.test(line)) {
      const item = line.replace(ORDERED_RE, '')
      if (last?.kind === 'ordered') last.items.push(item)
      else blocks.push({ kind: 'ordered', items: [item] })
    } else if (UNORDERED_RE.test(line)) {
      const item = line.replace(UNORDERED_RE, '')
      if (last?.kind === 'unordered') last.items.push(item)
      else blocks.push({ kind: 'unordered', items: [item] })
    } else {
      blocks.push({ kind: 'paragraph', lines: [line] })
    }
  }
  return blocks
}

// **negrito** | *itálico* | `código` — um token por vez, resto é texto.
const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g

function renderInline(text: string): React.ReactNode[] {
  return text.split(INLINE_RE).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="typo-body-sm bg-surface-secondary px-2xs rounded">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

export default function MarkdownLite({ text, className = '' }: MarkdownLiteProps) {
  const blocks = parseBlocks(text)

  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      {blocks.map((block, i) => {
        if (block.kind === 'paragraph') {
          return <p key={i}>{renderInline(block.lines.join(' '))}</p>
        }
        const Tag = block.kind === 'ordered' ? 'ol' : 'ul'
        const style = block.kind === 'ordered' ? 'list-decimal' : 'list-disc'
        return (
          <Tag key={i} className={`${style} list-outside pl-md flex flex-col gap-2xs`}>
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </Tag>
        )
      })}
    </div>
  )
}
