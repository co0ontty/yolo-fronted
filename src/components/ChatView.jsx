import React, { useRef, useEffect } from 'react'

export function ChatView({
  session,
  messages,
  onSendMessage
}) {
  const [inputText, setInputText] = useState('')
  const inputRef = useRef(null)

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

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div className="chat-info">
          <h3>{session.directory}</h3>
          <p>权限模式: {session.permission}</p>
        </div>
      </div>

      <div className="message-list">
        {messages.map(message => (
          <div key={message.id} className="message">
            <div className="message-role">
              {message.role === 'user' ? '我' : 'AI'}
            </div>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
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
          rows={3}
        />
        <button className="send-button" onClick={handleSend} disabled={!inputText.trim()}>
          发送
        </button>
      </div>
    </div>
  )
}
