import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SlashCommandAutocomplete } from './SlashCommandAutocomplete'

// Helper function to check if cursor is at a slash command
function isSlashCommandActive(text, cursorPosition) {
  const textBeforeCursor = text.substring(0, cursorPosition)
  const lastLine = textBeforeCursor.split('\n').pop()
  return /^\/\w*$/.test(lastLine)
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  disabled,
  isGenerating,
  placeholder = '输入消息...'
}) {
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showSlashCommands, setShowSlashCommands] = useState(false)
  const textareaRef = useRef(null)
  const focusTimeoutRef = useRef(null)

  const scrollIntoComfortView = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    requestAnimationFrame(() => {
      textarea.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [])

  const handleSlashCommandSelect = useCallback((command) => {
    const textBeforeCursor = value.substring(0, cursorPosition)
    const textAfterCursor = value.substring(cursorPosition)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines[lines.length - 1]

    const slashMatch = currentLine.match(/\/(\w*)$/)
    if (slashMatch) {
      const beforeSlash = textBeforeCursor.slice(0, -slashMatch[1].length - 1)
      const newText = beforeSlash + `/${command} `
      const newCursorPos = newText.length

      onChange(newText + textAfterCursor.slice(slashMatch.index + slashMatch[0].length))
      setCursorPosition(newCursorPos)

      // Clear any existing timeout
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current)
      }

      focusTimeoutRef.current = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }

    setShowSlashCommands(false)
  }, [value, cursorPosition, onChange])

  const handleChange = (e) => {
    const newValue = e.target.value
    const newCursorPosition = e.target.selectionStart
    onChange(newValue)
    setCursorPosition(newCursorPosition)
    setShowSlashCommands(isSlashCommandActive(newValue, newCursorPosition))
  }

  const handleSelect = (e) => {
    setCursorPosition(e.target.selectionStart)
    setShowSlashCommands(isSlashCommandActive(e.target.value, e.target.selectionStart))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSend(value.trim())
      }
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current)
      }
    }
  }, [])

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [value])

  return (
    <div className="input-wrapper">
      <textarea
        ref={textareaRef}
        className="input-field"
        placeholder={placeholder}
        value={value}
        name="chat-message"
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onFocus={scrollIntoComfortView}
        onClick={scrollIntoComfortView}
        rows={1}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-form-type="other"
        enterKeyHint="send"
        inputMode="text"
      />

      <div className="input-buttons">
        {isGenerating && (
          <button
            className="stop-btn"
            onClick={onStop}
            aria-label="停止生成"
            title="停止生成 (Ctrl+X)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>
        )}
        <button
          className="send-btn"
          onClick={() => onSend(value.trim())}
          disabled={!value.trim() || disabled}
          aria-label="发送消息"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z"/>
          </svg>
        </button>
      </div>

      {showSlashCommands && (
        <SlashCommandAutocomplete
          inputValue={value}
          cursorPosition={cursorPosition}
          onSelect={handleSlashCommandSelect}
          onClose={() => setShowSlashCommands(false)}
        />
      )}
    </div>
  )
}
