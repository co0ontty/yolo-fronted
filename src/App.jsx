import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatView } from './components/ChatView'
import { NewSessionModal } from './components/NewSessionModal'
import { HelpModal } from './components/HelpModal'
import { PermissionModal } from './components/PermissionModal'
import { CommandPalette } from './components/CommandPalette'
import { ChatInput } from './components/ChatInput'
import { MarkdownContent } from './components/MarkdownContent'
import { Login } from './components/Login'
import { CLITokenManager } from './components/CLITokenManager'
import { useWebSocket } from './hooks/useWebSocket'
import './App.mobile.css'

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
  const [isCLITokenManagerOpen, setIsCLITokenManagerOpen] = useState(false)

  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
  const getSessionId = useCallback((data) => data?.session_id || data?.session || data?.content?.session_id || null, [])

  // 检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token')

      try {
        const headers = {}
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        const response = await fetch('/api/check-session', { headers })
        const data = await response.json()
        if (data.authenticated) {
          setIsAuthenticated(true)
          setAuthToken(token || null)
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

  useEffect(() => {
    if (!currentSession) return
    const updatedSession = sessions.find(session => session.id === currentSession.id)
    if (!updatedSession) {
      setCurrentSession(null)
      setMessages([])
      return
    }
    if (updatedSession.directory !== currentSession.directory || updatedSession.permission !== currentSession.permission) {
      setCurrentSession(updatedSession)
    }
  }, [sessions, currentSession])

  useEffect(() => {
    if (!currentSession || isGenerating) return
    const updatedSession = sessions.find(session => session.id === currentSession.id)
    if (!updatedSession?.messages) return
    setMessages(updatedSession.messages.map(msg => ({
      id: msg.id || `${msg.session_id}-${msg.time}`,
      sessionId: msg.session_id,
      role: msg.role,
      content: msg.content,
      time: new Date(msg.time),
      isComplete: msg.is_complete
    })))
  }, [sessions, currentSession, isGenerating])

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
    authToken,
    isAuthenticated
  )

  const handleStreamMessage = (data) => {
    const sessionId = getSessionId(data)
    setIsGenerating(true)
    setMessages(prev => {
      const updated = [...prev]
      let index = -1
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].sessionId === sessionId && updated[i].role === 'assistant' && !updated[i].isComplete) {
          index = i
          break
        }
      }
      if (index !== -1) {
        // 后端发送的是 data.content (字符串)，不是 data.content.text
        const textContent = typeof data.content === 'string' ? data.content : (data.content?.text || '')
        updated[index] = { ...updated[index], content: updated[index].content + textContent }
      }
      return updated
    })
  }

  const handleMessageComplete = (data) => {
    const sessionId = getSessionId(data)
    setIsGenerating(false)
    setMessages(prev => {
      const updated = [...prev]
      let index = -1
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].sessionId === sessionId && updated[i].role === 'assistant' && !updated[i].isComplete) {
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
    if (session.messages && session.messages.length > 0) {
      setMessages(session.messages.map(msg => ({
        id: msg.id || `${msg.session_id}-${msg.time}`,
        sessionId: msg.session_id,
        role: msg.role,
        content: msg.content,
        time: new Date(msg.time),
        isComplete: msg.is_complete
      })))
    } else {
      setMessages([])
    }
    setCurrentSession(session)
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
      {/* 侧边栏 */}
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
        onManageCLITokens={() => setIsCLITokenManagerOpen(true)}
      />

      {/* 侧边栏遮罩 */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* 主内容区域 */}
      <div className="main-content">
        {/* 顶部导航栏 */}
        <header className="top-nav">
          <div className="top-nav-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="切换菜单"
            >
              <span className={sidebarOpen ? 'open' : ''}></span>
              <span></span>
              <span></span>
            </button>
          </div>

          <div className="top-nav-center">
            {currentSession ? (
              <div className="nav-title-wrapper">
                <div className="nav-title">{currentSession.directory}</div>
                <div className="nav-subtitle">
                  <span className={`nav-badge mode-${currentSession.permission}`}>
                    {currentSession.permission}
                  </span>
                </div>
              </div>
            ) : (
              <div className="nav-title">Vibe Coding</div>
            )}
          </div>

          <div className="top-nav-right">
            <button
              className="icon-btn"
              onClick={() => setIsCommandPaletteOpen(true)}
              aria-label="命令面板"
              title="命令面板 (Ctrl+K)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
            <button
              className="icon-btn"
              onClick={() => setIsHelpModalOpen(true)}
              aria-label="帮助文档"
              title="帮助文档 (Ctrl+?)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <path d="M12 17h.01"/>
              </svg>
            </button>
          </div>
        </header>

        {/* 聊天内容 */}
        <div className="chat-container">
          {currentSession ? (
            <>
              {/* 消息列表 */}
              <div className="messages-container">
                {messages.map(message => (
                  <div key={message.id} className={`message ${message.role}`}>
                    <div className="message-role">
                      {message.role === 'user' ? '你' : message.role === 'assistant' ? 'AI' : '系统'}
                    </div>
                    <div className={`message-content ${!message.isComplete ? 'streaming' : ''}`}>
                      {renderMessageContent(message)}
                    </div>
                  </div>
                ))}
                <div className="message-list-end" />
              </div>

              {/* 输入区域 */}
              <div className="input-area">
                <ChatInput
                  value={inputText}
                  onChange={setInputText}
                  onSend={handleSendMessage}
                  onStop={stopGeneration}
                  isGenerating={isGenerating}
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
                <button
                  className="quick-start-btn"
                  onClick={() => setIsNewSessionModalOpen(true)}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  新建会话
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 模态框 */}
      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        onSubmit={handleNewSession}
        authToken={authToken}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onManageCLITokens={() => setIsCLITokenManagerOpen(true)}
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

      <CLITokenManager
        isOpen={isCLITokenManagerOpen}
        onClose={() => setIsCLITokenManagerOpen(false)}
        authToken={authToken}
        serverUrl={`${window.location.protocol}//${window.location.host}`}
      />
    </div>
  )
}

export default App
