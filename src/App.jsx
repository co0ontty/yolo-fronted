import React, { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { MessageList } from './components/MessageList'
import { ChatView } from './components/ChatView'
import { NewSessionModal } from './components/NewSessionModal'
import { HelpModal } from './components/HelpModal'
import { useWebSocket } from './hooks/useWebSocket'

function App() {
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)

  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`

  const { sendMessage, isConnected, cliConnected } = useWebSocket(
    wsUrl,
    (message) => {
      const data = JSON.parse(message)

      switch (data.type) {
        case 'sessions':
          setSessions(data.content)
          break
        case 'stream':
          handleStreamMessage(data)
          break
        case 'message_complete':
          handleMessageComplete(data)
          break
      }
    }
  )

  const handleStreamMessage = (data) => {
    setMessages(prev => {
      const updated = [...prev]
      const index = updated.findIndex(m => m.sessionId === data.session)
      if (index !== -1) {
        const message = updated[index]
        message.content = message.content + data.content.text
      }
      return updated
    })
  }

  const handleMessageComplete = (data) => {
    setMessages(prev => {
      const updated = [...prev]
      const index = updated.findIndex(m => m.sessionId === data.session)
      if (index !== -1) {
        updated[index].isComplete = true
      }
      return updated
    })
  }

  const handleNewSession = (sessionData) => {
    sendMessage({
      type: 'create_session',
      content: sessionData
    })
    setIsNewSessionModalOpen(false)
  }

  const handleSelectSession = (session) => {
    setCurrentSession(session)
  }

  const handleSendMessage = (text) => {
    if (!currentSession) {
      alert('请先创建或选择一个会话')
      return
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sessionId: currentSession.id,
      role: 'user',
      content: text,
      time: new Date(),
      isComplete: true
    }, {
      id: (Date.now() + 1).toString(),
      sessionId: currentSession.id,
      role: 'assistant',
      content: '',
      time: new Date(),
      isComplete: false
    }])

    sendMessage({
      type: 'chat',
      content: {
        session_id: currentSession.id,
        message: text
      }
    })
  }

  return (
    <div className="app-container">
      <Sidebar
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={handleSelectSession}
        onNewSession={() => setIsNewSessionModalOpen(true)}
        onHelp={() => setIsHelpModalOpen(true)}
        isConnected={isConnected}
        cliConnected={cliConnected}
      />

      <div className="chat-area">
        {currentSession ? (
          <ChatView
            session={currentSession}
            messages={messages.filter(m => m.sessionId === currentSession.id)}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="welcome-screen">
            <div className="welcome-content">
              <div className="welcome-brand">VIBE CODING</div>
              <h1 className="welcome-title">
                Code with<br /><span>AI.</span>
              </h1>
              <p className="welcome-subtitle">
                创建一个会话，开始与 Claude Code 协作编程。
              </p>
              <div className="welcome-hint">
                点击左侧 <kbd>+ 新会话</kbd> 开始
              </div>
            </div>
          </div>
        )}
      </div>

      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        onSubmit={handleNewSession}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  )
}

export default App
