import React, { useMemo } from 'react'

function highlightCode(code, language) {
  const escapeHtml = (text) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return text.replace(/[&<>"']/g, char => escapeMap[char])
  }

  const keywords = {
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'typeof', 'instanceof'],
    python: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'as', 'try', 'except', 'raise', 'with', 'lambda', 'yield', 'async', 'await', 'True', 'False', 'None'],
    go: ['func', 'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'type', 'struct', 'interface', 'map', 'chan', 'go', 'defer', 'select', 'package', 'import', 'var', 'const'],
    bash: ['if', 'then', 'else', 'fi', 'for', 'do', 'done', 'while', 'until', 'case', 'esac', 'in', 'function', 'return', 'export', 'source']
  }

  const highlightKeywords = (text, langKeywords) => {
    let result = escapeHtml(text)
    langKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g')
      result = result.replace(regex, `<span class="code-keyword">${keyword}</span>`)
    })
    return result
  }

  const lang = language?.toLowerCase() || 'text'
  const langKeywords = keywords[lang] || []

  if (langKeywords.length > 0) {
    return highlightKeywords(code, langKeywords)
  }

  return escapeHtml(code)
}

function parseMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let inCodeBlock = false
  let codeBlockLang = ''
  let codeBlockContent = []
  let currentParagraph = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join('\n')
      elements.push({ type: 'paragraph', content: parseInline(content) })
      currentParagraph = []
    }
  }

  const parseInline = (line) => {
    let result = line

    result = result.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>')

    result = result.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

    return result
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        flushParagraph()
        inCodeBlock = true
        codeBlockLang = line.slice(3).trim()
        codeBlockContent = []
      } else {
        elements.push({
          type: 'code',
          language: codeBlockLang,
          content: codeBlockContent.join('\n')
        })
        inCodeBlock = false
        codeBlockLang = ''
        codeBlockContent = []
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }

    if (line.startsWith('# ')) {
      flushParagraph()
      elements.push({ type: 'h1', content: parseInline(line.slice(2)) })
    } else if (line.startsWith('## ')) {
      flushParagraph()
      elements.push({ type: 'h2', content: parseInline(line.slice(3)) })
    } else if (line.startsWith('### ')) {
      flushParagraph()
      elements.push({ type: 'h3', content: parseInline(line.slice(4)) })
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph()
      elements.push({ type: 'li', content: parseInline(line.slice(2)) })
    } else if (line.match(/^\d+\. /)) {
      flushParagraph()
      elements.push({ type: 'li', content: parseInline(line.replace(/^\d+\. /, '')), ordered: true })
    } else if (line.startsWith('> ')) {
      flushParagraph()
      elements.push({ type: 'blockquote', content: parseInline(line.slice(2)) })
    } else if (line.trim() === '') {
      flushParagraph()
    } else {
      currentParagraph.push(line)
    }
  }

  flushParagraph()

  if (inCodeBlock) {
    elements.push({
      type: 'code',
      language: codeBlockLang,
      content: codeBlockContent.join('\n')
    })
  }

  return elements
}

export function MarkdownContent({ content, className = '' }) {
  const elements = useMemo(() => parseMarkdown(content), [content])

  const renderElement = (element, index) => {
    switch (element.type) {
      case 'paragraph':
        return <p key={index} dangerouslySetInnerHTML={{ __html: element.content }} />
      case 'h1':
        return <h1 key={index} dangerouslySetInnerHTML={{ __html: element.content }} />
      case 'h2':
        return <h2 key={index} dangerouslySetInnerHTML={{ __html: element.content }} />
      case 'h3':
        return <h3 key={index} dangerouslySetInnerHTML={{ __html: element.content }} />
      case 'li':
        return <li key={index} dangerouslySetInnerHTML={{ __html: element.content }} />
      case 'blockquote':
        return <blockquote key={index} dangerouslySetInnerHTML={{ __html: element.content }} />
      case 'code':
        return (
          <div key={index} className="code-block-wrapper">
            <div className="code-block-header">
              <span className="code-language">{element.language || 'text'}</span>
              <button 
                className="code-copy-button"
                onClick={() => navigator.clipboard.writeText(element.content)}
              >
                复制
              </button>
            </div>
            <pre className="code-block">
              <code 
                className={`language-${element.language}`}
                dangerouslySetInnerHTML={{ __html: highlightCode(element.content, element.language) }}
              />
            </pre>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={`markdown-content ${className}`}>
      {elements.map((element, index) => renderElement(element, index))}
    </div>
  )
}
