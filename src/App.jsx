import React, { useState, useEffect, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatView } from './components/ChatView'
import { NewSessionModal } from './components/NewSessionModal'
import { HelpModal } from './components/HelpModal'
import { PermissionModal } from './components/PermissionModal'
import { CommandPalette } from './components/CommandPalette'
import { StatusBar } from './components/StatusBar'
import { ChatInput } from './components/ChatInput'
import { MarkdownContent } from './components/MarkdownContent'
import { Login } from './components/Login'
import { useWebSocket } from './hooks/useWebSocket'

function App() {
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingPermissionRequest, setPendingPermissionRequest] = useState(null)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [tokenUsage, setTokenUsage] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authToken, setAuthToken] = useState(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`

  // 检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setIsCheckingAuth(false)
        return
      }

      try {
        const response = await fetch('/api/check-session', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        const data = await response.json()
        if (data.authenticated) {
          setIsAuthenticated(true)
          setAuthToken(token)
        }
      } catch (err) {
        console.error('检查认证状态失败:', err)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  // 处理登录
  const handleLogin = useCallback((token) => {
    setIsAuthenticated(true)
    setAuthToken(token)
  }, [])

  // 处理登出
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })
    } catch (err) {
      console.error('登出失败:', err)
    }
    localStorage.removeItem('auth_token')
    setIsAuthenticated(false)
    setAuthToken(null)
    setSessions([])
    setCurrentSession(null)
    setMessages([])
  }, [authToken])

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
        case 'permission_request':
          handlePermissionRequest(data)
          break
        case 'tool_use_request':
          handleToolUseRequest(data)
          break
        case 'token_usage':
          setTokenUsage(data.content)
          break
      }
    },
    authToken
  )

  const handleStreamMessage = (data) => {
    setIsGenerating(true)
    setMessages(prev => {
      const updated = [...prev]
      let index = -1
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].sessionId === data.session && updated[i].role === 'assistant' && !updated[i].isComplete) {
          index = i
          break
        }
      }
      if (index !== -1) {
        updated[index] = { ...updated[index], content: updated[index].content + data.content.text }
      }
      return updated
    })
  }

  const handleMessageComplete = (data) => {
    setIsGenerating(false)
    setMessages(prev => {
      const updated = [...prev]
      let index = -1
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].sessionId === data.session && updated[i].role === 'assistant' && !updated[i].isComplete) {
          index = i
          break
        }
      }
      if (index !== -1) {
        updated[index] = { ...updated[index], isComplete: true }
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
    setMessages([])
    setSidebarOpen(false)
  }

  const handleDeleteSession = (sessionId) => {
    sendMessage({
      type: 'delete_session',
      content: { session_id: sessionId }
    })
    if (currentSession?.id === sessionId) {
      setCurrentSession(null)
      setMessages([])
    }
  }

  const handleSendMessage = useCallback((text) => {
    if (!text.trim()) return
    if (!currentSession) {
      alert('请先创建或选择一个会话')
      return
    }

    if (text.startsWith('/')) {
      handleSlashCommand(text)
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
    setInputText('')
  }, [currentSession, sendMessage])

  const handleSlashCommand = (text) => {
    const parts = text.slice(1).split(' ')
    const command = parts[0].toLowerCase()
    const args = parts.slice(1).join(' ')

    switch (command) {
      case 'help':
        setIsHelpModalOpen(true)
        break
      case 'new':
        setIsNewSessionModalOpen(true)
        break
      case 'clear':
        setMessages([])
        break
      case 'export':
        exportSession()
        break
      case 'status':
        console.log('Session:', currentSession)
        console.log('Messages:', messages.length)
        console.log('Connected:', isConnected, cliConnected)
        break
      default:
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sessionId: currentSession?.id,
          role: 'system',
          content: `未知命令：/${command}。输入 /help 查看帮助。`,
          time: new Date(),
          isComplete: true
        }])
    }
    setInputText('')
  }

  const handlePermissionRequest = (data) => {
    const content = data.content
    setPendingPermissionRequest({
      requestId: content.request_id,
      sessionId: content.session_id,
      permission: content.permission,
      description: content.description,
      details: content.details,
      toolName: content.tool_name,
      command: content.command,
      filePath: content.file_path
    })
  }

  const handleToolUseRequest = (data) => {
    const content = data.content
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      sessionId: content.session_id,
      role: 'system',
      content: `🔧 工具调用：${content.tool_name}`,
      time: new Date(),
      isComplete: true
    }])
  }

  const handlePermissionResponse = (requestId, granted, allowSession) => {
    if (!pendingPermissionRequest) return

    sendMessage({
      type: 'permission_response',
      content: {
        session_id: pendingPermissionRequest.sessionId,
        request_id: requestId,
        granted: granted,
        allow_session: allowSession
      }
    })

    setPendingPermissionRequest(null)
  }

  const handleCommandPaletteExecute = useCallback((commandId) => {
    switch (commandId) {
      case 'new_session':
        setIsNewSessionModalOpen(true)
        break
      case 'switch_session':
        setSidebarOpen(true)
        break
      case 'delete_session':
        if (currentSession) {
          handleDeleteSession(currentSession.id)
        }
        break
      case 'help':
        setIsHelpModalOpen(true)
        break
      case 'toggle_sidebar':
        setSidebarOpen(prev => !prev)
        break
      case 'clear_messages':
        setMessages([])
        break
      case 'export_session':
        exportSession()
        break
      case 'rename_session':
        renameSession()
        break
      case 'copy_last_response':
        copyLastResponse()
        break
      case 'stop_generation':
        stopGeneration()
        break
    }
  }, [currentSession, messages])

  const exportSession = () => {
    if (!currentSession || messages.length === 0) return
    
    const markdown = messages.map(msg => {
      const role = msg.role === 'user' ? '🧑 You' : msg.role === 'assistant' ? '🤖 AI' : '⚙️ System'
      return `## ${role}\n\n${msg.content}\n`
    }).join('\n---\n\n')

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-${currentSession.id}-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renameSession = () => {
    if (!currentSession) return
    const newName = prompt('输入新的会话名称:', currentSession.directory)
    if (newName && newName !== currentSession.directory) {
      sendMessage({
        type: 'rename_session',
        content: {
          session_id: currentSession.id,
          new_name: newName
        }
      })
    }
  }

  const copyLastResponse = () => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
    if (lastAssistantMessage) {
      navigator.clipboard.writeText(lastAssistantMessage.content)
        .then(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sessionId: currentSession?.id,
            role: 'system',
            content: '✅ 已复制到最后回复',
            time: new Date(),
            isComplete: true
          }])
        })
    }
  }

  const stopGeneration = () => {
    sendMessage({
      type: 'stop',
      content: { session_id: currentSession?.id }
    })
    setIsGenerating(false)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(prev => !prev)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '?') {
        e.preventDefault()
        setIsHelpModalOpen(prev => !prev)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setIsNewSessionModalOpen(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault()
        stopGeneration()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSession])

  const renderMessageContent = (message) => {
    if (message.role === 'assistant' || message.role === 'user') {
      return <MarkdownContent content={message.content} />
    }
    return <span>{message.content}</span>
  }

  // 检查认证状态
  if (isCheckingAuth) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录，显示登录页面
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app-container">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <Sidebar
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={handleSelectSession}
        onNewSession={() => setIsNewSessionModalOpen(true)}
        onHelp={() => setIsHelpModalOpen(true)}
        onDeleteSession={handleDeleteSession}
        isConnected={isConnected}
        cliConnected={cliConnected}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <div className="chat-area">
        <div className="top-bar">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="切换菜单"
          >
            <span className={sidebarOpen ? 'open' : ''}></span>
          </button>
          <div className="top-actions">
            <button
              className="top-action-btn new-btn"
              onClick={() => setIsNewSessionModalOpen(true)}
              title="新会话 (Ctrl+N)"
            >
              + 新会话
            </button>
            <button
              className="top-action-btn help-btn"
              onClick={() => setIsHelpModalOpen(true)}
              title="安装指南 (Ctrl+?)"
            >
              ?
            </button>
          </div>
        </div>

        {currentSession ? (
          <>
            <div className="chat-header">
              <div className="chat-info">
                <h3>{currentSession.directory}</h3>
                <span className={`permission-badge mode-${currentSession.permission}`}>
                  {currentSession.permission}
                </span>
              </div>
              <div className="chat-actions">
                <button 
                  className="chat-action-btn" 
                  onClick={() => setIsCommandPaletteOpen(true)}
                  title="命令面板 (Ctrl+K)"
                >
                  ⌘K
                </button>
                <button 
                  className="chat-action-btn"
                  onClick={stopGeneration}
                  disabled={!isGenerating}
                  title="停止生成 (Ctrl+X)"
                >
                  ⏹️
                </button>
              </div>
            </div>

            <div className="message-list">
              {messages.map(message => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className={`message-role role-${message.role}`}>
                    {message.role === 'user' ? '🧑' : message.role === 'assistant' ? '🤖' : '⚙️'}
                  </div>
                  <div className={`message-content ${!message.isComplete ? 'streaming' : ''}`}>
                    {renderMessageContent(message)}
                  </div>
                </div>
              ))}
              <div className="message-list-end" />
            </div>

            <div className="message-input-wrapper">
              <ChatInput
                value={inputText}
                onChange={setInputText}
                onSend={handleSendMessage}
                disabled={isGenerating || !cliConnected}
                placeholder={cliConnected ? "输入消息，或输入 / 查看命令..." : "CLI 未连接"}
              />
            </div>
          </>
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
                按 <kbd>Ctrl+K</kbd> 打开命令面板
              </div>
            </div>
          </div>
        )}
      </div>

      <StatusBar
        isConnected={isConnected}
        cliConnected={cliConnected}
        session={currentSession}
        tokenUsage={tokenUsage}
      />

      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        onSubmit={handleNewSession}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <PermissionModal
        isOpen={!!pendingPermissionRequest}
        request={pendingPermissionRequest}
        onRespond={handlePermissionResponse}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onExecute={handleCommandPaletteExecute}
        sessions={sessions}
        currentSession={currentSession}
      />
    </div>
  )
}

export default App
