function normalizeLineEndings(text) {
  return String(text || '').replace(/\r\n?/g, '\n')
}

export function normalizeTextContent(text) {
  return normalizeLineEndings(text)
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
}

export function formatThinkingPreview(text) {
  const normalized = normalizeTextContent(text)
  const lines = normalized.split('\n').map(line => line.trim()).filter(Boolean)
  return lines[lines.length - 1] || ''
}

export function countMeaningfulLines(text) {
  return normalizeTextContent(text).split('\n').map(line => line.trim()).filter(Boolean).length
}

export function tryParseJson(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function formatToolParameters(parameters) {
  const parsed = tryParseJson(parameters)
  if (!parsed) return null
  return JSON.stringify(parsed, null, 2)
}

export function detectTodoList(text) {
  const normalized = normalizeTextContent(text)
  const lines = normalized.split('\n')
  const todoPattern = /^\s*(?:[-*]|\d+\.)\s+(?:\[(?: |x|X)\]\s+)?/i
  const todoLines = lines.filter(line => todoPattern.test(line))
  if (todoLines.length < 2) return null
  return todoLines.map(line => {
    const checked = /^\s*(?:[-*]|\d+\.)\s+\[(x|X)\]\s+/i.test(line)
    const unchecked = /^\s*(?:[-*]|\d+\.)\s+\[ \]\s+/i.test(line)
    const label = line
      .replace(/^\s*(?:[-*]|\d+\.)\s+/, '')
      .replace(/^\[(?: |x|X)\]\s+/i, '')
      .trim()
    return {
      checked,
      unchecked,
      label,
    }
  })
}

export function normalizeRawEventPayload(payload) {
  if (payload == null) return ''
  if (typeof payload === 'string') return normalizeTextContent(payload)
  try {
    return JSON.stringify(payload, null, 2)
  } catch {
    return String(payload)
  }
}

export function rebuildBlocksFromContent(content) {
  // 历史消息通常只有纯文本，这里尽量重建为接近实时流式消息的块结构，
  // 这样用户切回旧会话时，阅读体验会更一致。
  const normalized = normalizeTextContent(content)
  if (!normalized.trim()) return []

  const lines = normalized.split('\n')
  const blocks = []
  let textBuffer = []
  let thinkingBuffer = []
  let inThinking = false

  const flushText = () => {
    if (!textBuffer.length) return
    blocks.push({ type: 'text', content: textBuffer.join('\n').trim(), isComplete: true })
    textBuffer = []
  }

  const flushThinking = () => {
    if (!thinkingBuffer.length) return
    blocks.push({ type: 'thinking', content: thinkingBuffer.join('\n').trim(), isComplete: true })
    thinkingBuffer = []
  }

  lines.forEach(line => {
    if (/^thinking[:：]?\s*$/i.test(line.trim())) {
      flushText()
      inThinking = true
      return
    }
    if (inThinking && /^---+$/.test(line.trim())) {
      flushThinking()
      inThinking = false
      return
    }
    if (inThinking) {
      thinkingBuffer.push(line)
    } else {
      textBuffer.push(line)
    }
  })

  flushThinking()
  flushText()
  return blocks.filter(block => block.content)
}
