const INLINE_PATTERN =
  /(\*\*.+?\*\*|\*.+?\*|`[^`]+`|\[[^\]\n]+]\([^)\s]+\))/g

export function parseInline(text) {
  if (!text) return [{ type: 'text', text: '' }]

  const nodes = []
  let lastIndex = 0
  let match

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }

    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push({ type: 'bold', text: token.slice(2, -2) })
    } else if (token.startsWith('*')) {
      nodes.push({ type: 'italic', text: token.slice(1, -1) })
    } else if (token.startsWith('`')) {
      nodes.push({ type: 'code', text: token.slice(1, -1) })
    } else if (token.startsWith('[')) {
      const close = token.lastIndexOf('](')
      nodes.push({
        type: 'link',
        text: token.slice(1, close),
        href: token.slice(close + 2, -1)
      })
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return nodes
}

function parseList(lines, startIndex, ordered) {
  const items = []
  let i = startIndex

  while (i < lines.length) {
    const line = lines[i]
    const isItem = ordered
      ? /^\d+\.\s+/.test(line)
      : /^[-*]\s+/.test(line)
    if (!isItem) break

    items.push(line.replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ''))
    i += 1
  }

  return { items, nextIndex: i }
}

export function markdownToBlocks(markdown) {
  if (!markdown || !markdown.trim()) return []

  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i += 1
      continue
    }

    if (/^#{1,3}\s+/.test(trimmed)) {
      const level = trimmed.match(/^#+/)[0].length
      blocks.push({
        type: 'heading',
        level,
        text: trimmed.replace(/^#{1,3}\s+/, '').trim()
      })
      i += 1
      continue
    }

    if (/^-{3,}$/.test(trimmed)) {
      blocks.push({ type: 'hr' })
      i += 1
      continue
    }

    if (/^```/.test(trimmed)) {
      const codeLines = []
      i += 1
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i])
        i += 1
      }
      i += 1
      blocks.push({ type: 'code', code: codeLines.join('\n') })
      continue
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
        i += 1
      }
      blocks.push({ type: 'blockquote', content: parseInline(quoteLines.join('\n')) })
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const { items, nextIndex } = parseList(lines, i, false)
      blocks.push({ type: 'list', ordered: false, items })
      i = nextIndex
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const { items, nextIndex } = parseList(lines, i, true)
      blocks.push({ type: 'list', ordered: true, items })
      i = nextIndex
      continue
    }

    const paragraphLines = []
    while (i < lines.length && lines[i].trim()) {
      paragraphLines.push(lines[i])
      i += 1
    }
    blocks.push({ type: 'paragraph', content: parseInline(paragraphLines.join('\n')) })
  }

  return blocks
}
