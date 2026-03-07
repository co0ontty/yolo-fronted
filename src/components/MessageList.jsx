import React from 'react'

export function MessageList({ messages }) {
  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.role}`}>
          <div className="message-role">{message.role === 'user' ? '我' : 'AI'}</div>
          <div className="message-content">{message.content}</div>
          {message.time && (
            <div className="message-time">
              {message.time.toLocaleTimeString()}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
