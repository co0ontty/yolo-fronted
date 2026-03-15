import React, { useState, useMemo } from 'react'
import { MarkdownContent } from './MarkdownContent'

// SVG icons as components
const ChevronIcon = ({ expanded }) => (
  <svg
    className={`block-chevron ${expanded ? 'expanded' : ''}`}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    width="14"
    height="14"
  >
    <path d="M6 4l4 4-4 4" />
  </svg>
)

const ToolIcon = ({ name }) => {
  const iconMap = {
    Read: 'M2 3h6a4 4 0 014 4v10a3 3 0 00-3-3H2z M22 3h-6a4 4 0 00-4 4v10a3 3 0 013-3h7z',
    Write: 'M12 20h9 M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
    Edit: 'M12 20h9 M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
    Bash: 'M4 17l6-6-6-6 M12 19h8',
    Grep: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    Glob: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    Agent: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
    WebFetch: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z M2 12h20 M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
    LSP: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  }
  const path = iconMap[name] || iconMap.Bash
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

// Thinking block - collapsible, shows last line by default
function ThinkingBlock({ content, isComplete }) {
  const [expanded, setExpanded] = useState(false)

  const lastLine = useMemo(() => {
    if (!content) return ''
    const lines = content.trim().split('\n').filter(l => l.trim())
    return lines[lines.length - 1] || ''
  }, [content])

  const lineCount = useMemo(() => {
    return content ? content.trim().split('\n').filter(l => l.trim()).length : 0
  }, [content])

  return (
    <div className={`block-thinking ${expanded ? 'expanded' : ''}`}>
      <div className="block-header" onClick={() => setExpanded(!expanded)}>
        <ChevronIcon expanded={expanded} />
        <span className="block-label">Thinking</span>
        {!expanded && lineCount > 1 && (
          <span className="block-meta">{lineCount} lines</span>
        )}
        {!isComplete && (
          <span className="block-streaming-dot" />
        )}
      </div>
      {expanded ? (
        <div className="block-body">
          <div className="thinking-content">{content}</div>
        </div>
      ) : (
        <div className="block-preview">
          <span className="thinking-preview-text">{lastLine}</span>
        </div>
      )}
    </div>
  )
}

// Tool use block - compact display
function ToolUseBlock({ toolName, summary, parameters, description }) {
  const [expanded, setExpanded] = useState(false)
  const isAgent = toolName === 'Agent' || toolName === 'Task'

  let parsedParams = null
  if (parameters) {
    try {
      parsedParams = typeof parameters === 'string' ? JSON.parse(parameters) : parameters
    } catch { /* ignore */ }
  }

  const displaySummary = summary || description || ''

  return (
    <div className={`block-tool-use ${isAgent ? 'is-agent' : ''}`}>
      <div className="block-header" onClick={() => parameters && setExpanded(!expanded)}>
        <ToolIcon name={toolName} />
        <span className="block-label">{toolName}</span>
        {displaySummary && (
          <span className="tool-summary">{displaySummary}</span>
        )}
        {parameters && <ChevronIcon expanded={expanded} />}
      </div>
      {expanded && parsedParams && (
        <div className="block-body">
          <pre className="tool-params">{JSON.stringify(parsedParams, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

// Tool result block - collapsible output
function ToolResultBlock({ toolName, success, content }) {
  const [expanded, setExpanded] = useState(false)

  const hasContent = content && content.trim().length > 0
  const isLong = hasContent && content.split('\n').length > 3

  const preview = useMemo(() => {
    if (!hasContent) return success ? 'OK' : 'Failed'
    const lines = content.trim().split('\n')
    if (lines.length <= 3) return content.trim()
    return lines.slice(0, 2).join('\n') + '...'
  }, [content, success, hasContent])

  return (
    <div className={`block-tool-result ${success ? 'success' : 'failure'}`}>
      <div className="block-header" onClick={() => isLong && setExpanded(!expanded)}>
        <span className={`result-indicator ${success ? 'success' : 'failure'}`}>
          {success ? '\u2713' : '\u2717'}
        </span>
        <span className="block-label">{toolName}</span>
        {isLong && <ChevronIcon expanded={expanded} />}
      </div>
      {hasContent && (
        <div className={`block-body ${isLong && !expanded ? 'truncated' : ''}`}>
          <pre className="tool-output">{expanded ? content : preview}</pre>
        </div>
      )}
    </div>
  )
}

// Text block - rendered as markdown
function TextBlock({ content }) {
  if (!content || !content.trim()) return null
  return (
    <div className="block-text">
      <MarkdownContent content={content} />
    </div>
  )
}

// Main component
export function MessageBlocks({ blocks, isComplete }) {
  if (!blocks || blocks.length === 0) return null

  return (
    <div className="message-blocks">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'thinking':
            return <ThinkingBlock key={index} content={block.content} isComplete={block.isComplete || isComplete} />
          case 'tool_use':
            return <ToolUseBlock key={index} toolName={block.toolName} summary={block.summary} parameters={block.parameters} description={block.description} />
          case 'tool_result':
            return <ToolResultBlock key={index} toolName={block.toolName} success={block.success} content={block.content} />
          case 'text':
          default:
            return <TextBlock key={index} content={block.content} />
        }
      })}
    </div>
  )
}
