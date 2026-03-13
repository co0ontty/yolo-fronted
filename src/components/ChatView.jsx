import React, { useState, useRef, useEffect } from 'react'

export function ChatView({
  session,
  messages,
  onSendMessage
}) {
  const [inputText, setInputText] = useState('')
  const inputRef = useRef(null)
  const messagesEndRef = useRef(null)

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim())
      setInputText('')
    }
  }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  // 移动端：消息更新后自动聚焦输入框
  useEffect(() => {
    if (messages.length > 0 && inputRef.current && window.innerWidth <= 480) {
      // 短暂延迟确保键盘弹出
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [messages.length])

  const permissionClass = `permission-badge mode-${session.permission}`

  const getRoleClass = (role) => {
    switch (role) {
      case 'user':
        return 'role-user'
      case 'system':
        return 'role-system'
      default:
        return 'role-assistant'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'user':
        return 'You'
      case 'system':
        return 'SYS'
      default:
        return 'AI'
    }
  }

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div className="chat-info">
          <h3>{session.directory}</h3>
          <span className={permissionClass}>{session.permission}</span>
        </div>
      </div>

      <div className="message-list">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className={`message-role ${getRoleClass(message.role)}`}>
              {getRoleLabel(message.role)}
            </div>
            <div className={`message-content ${!message.isComplete ? 'streaming' : ''}`}>
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input">
        <textarea
          ref={inputRef}
          className="input-field"
          placeholder="输入消息..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          rows={2}
        />
        <button className="send-button" onClick={handleSend} disabled={!inputText.trim()}>
          发送
        </button>
      </div>
    </div>
  )
}
