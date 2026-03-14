import React, { useMemo } from 'react'

function formatTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'

  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

export function Sidebar({
  sessions,
  currentSession,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isConnected,
  cliConnected,
  isOpen,
  onToggle,
  onLogout
}) {
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [sessions])

  const handleDeleteClick = (e, session) => {
    e.stopPropagation()
    if (onDeleteSession) {
      onDeleteSession(session.id)
    }
  }

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>Vibe Coding</h2>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? (cliConnected ? 'connected' : '') : 'disconnected'}`} />
          <span className="status-text">
            {isConnected ? (cliConnected ? '已连接' : 'CLI 连接中...') : '连接中...'}
          </span>
        </div>
      </div>

      <div className="sidebar-content">
        <button className="sidebar-new-btn" onClick={onNewSession}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          新建会话
        </button>

        <div className="sessions-list">
          {sortedSessions.length === 0 ? (
            <div className="empty-sessions">
              <p>暂无会话</p>
            </div>
          ) : (
            sortedSessions.map(session => (
              <div
                key={session.id}
                className={`session-item ${currentSession?.id === session.id ? 'active' : ''}`}
              >
                <div
                  className="session-info"
                  onClick={() => onSelectSession(session)}
                >
                  <div className="session-id">#{session.id.slice(0, 8)}</div>
                  <div className="session-directory">{session.directory}</div>
                  <div className="session-meta">
                    <span className="session-permission">{session.permission}</span>
                    <span className="session-time">{formatTime(session.created_at)}</span>
                  </div>
                </div>
                <button
                  className="delete-session-btn"
                  onClick={(e) => handleDeleteClick(e, session)}
                  title="删除"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          退出登录
        </button>
      </div>
    </div>
  )
}