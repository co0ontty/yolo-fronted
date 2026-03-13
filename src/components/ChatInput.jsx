import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SlashCommandAutocomplete } from './SlashCommandAutocomplete'

export function ChatInput({ 
  value, 
  onChange, 
  onSend, 
  disabled,
  placeholder = '输入消息...' 
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showSlashCommands, setShowSlashCommands] = useState(false)
  const textareaRef = useRef(null)

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
      
      setTimeout(() => {
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

    const textBeforeCursor = newValue.substring(0, newCursorPosition)
    const lastLine = textBeforeCursor.split('\n').pop()
    const isSlashCommand = /^\/\w*$/.test(lastLine)
    
    setShowSlashCommands(isSlashCommand)
  }

  const handleSelect = (e) => {
    setCursorPosition(e.target.selectionStart)
    
    const textBeforeCursor = e.target.value.substring(0, e.target.selectionStart)
    const lastLine = textBeforeCursor.split('\n').pop()
    const isSlashCommand = /^\/\w*$/.test(lastLine)
    
    setShowSlashCommands(isSlashCommand)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSend(value.trim())
      }
    }
  }

  useEffect(() => {
    if (textareaRef.current && isFocused) {
      textareaRef.current.focus()
    }
  }, [isFocused])

  return (
    <div className={`chat-input-container ${isFocused ? 'focused' : ''}`}>
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input-field"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onSelect={handleSelect}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={1}
          disabled={disabled}
        />
        
        {showSlashCommands && (
          <SlashCommandAutocomplete
            inputValue={value}
            cursorPosition={cursorPosition}
            onSelect={handleSlashCommandSelect}
            onClose={() => setShowSlashCommands(false)}
          />
        )}
      </div>
      
      <button 
        className="chat-send-button"
        onClick={() => onSend(value.trim())}
        disabled={!value.trim() || disabled}
      >
        <span>发送</span>
        <span className="send-icon">➤</span>
      </button>
    </div>
  )
}
