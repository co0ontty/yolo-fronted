import React from 'react'

// 格式化时间显示
function formatTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  // 小于 1 分钟
  if (diff < 60000) {
    return '刚刚'
  }
  // 小于 1 小时
  if (diff < 3600000) {
    return Math.floor(diff / 60000) + '分钟前'
  }
  // 小于 24 小时
  if (diff < 86400000) {
    return Math.floor(diff / 3600000) + '小时前'
  }
  // 小于 7 天
  if (diff < 604800000) {
    return Math.floor(diff / 86400000) + '天前'
  }
  // 超过 7 天显示具体日期
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

export function Sidebar({
  sessions,
  currentSession,
  onSelectSession,
  onNewSession,
  onHelp,
  onDeleteSession,
  isConnected,
  cliConnected,
  isOpen,
  onToggle,
  onLogout,
  onManageCLITokens
}) {
  // 按创建时间倒序排列（最新的在最上面）
  const sortedSessions = [...sessions].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at)
  })

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
        <div className="sessions-list">
          {sortedSessions.length === 0 ? (
            <div className="empty-sessions">
              <p>暂无会话</p>
              <button className="quick-start-btn" onClick={onNewSession}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                创建会话
              </button>
            </div>
          ) : (
            sortedSessions.map(session => (
              <div
                key={session.id}
                className={`session-item ${
                  currentSession?.id === session.id ? 'active' : ''
                }`}
              >
                <div
                  className="session-info"
                  onClick={() => onSelectSession(session)}
                >
                  <div className="session-id">#{session.id.slice(0, 8)}</div>
                  <div className="session-directory">
                    {session.directory}
                  </div>
                  <div className="session-meta">
                    <span className="session-permission">
                      {session.permission}
                    </span>
                    <span className="session-time">
                      {formatTime(session.created_at)}
                    </span>
                  </div>
                </div>
                <button
                  className="delete-session-btn"
                  onClick={(e) => handleDeleteClick(e, session)}
                  title="删除会话"
                  aria-label={`删除会话 ${session.directory}`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        {onManageCLITokens && (
          <button onClick={onManageCLITokens} className="cli-token-btn">
            🔑 CLI Token 管理
          </button>
        )}
        <button onClick={onLogout} className="logout-btn">
          退出登录
        </button>
      </div>
    </div>
  )
}
