import React from 'react'

export function Sidebar({
  sessions,
  currentSession,
  onSelectSession,
  onNewSession,
  onHelp,
  isConnected,
  cliConnected
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Vibe Coding</h2>
        <div className="connection-status">
          {isConnected ? (
            cliConnected ? (
              <span className="status-connected">已就绪</span>
            ) : (
              <span className="status-warning">CLI 未连接</span>
            )
          ) : (
            <span className="status-disconnected">未连接</span>
          )}
        </div>
      </div>

      <div className="sidebar-actions">
        <button onClick={onNewSession} className="new-session-button">
          + 新会话
        </button>
        <button onClick={onHelp} className="help-button">
          ?
        </button>
      </div>

      <div className="sidebar-content">
        <div className="sessions-list">
          {sessions.length === 0 ? (
            <div className="empty-sessions">
              <p>暂无会话</p>
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className={`session-item ${
                  currentSession?.id === session.id ? 'active' : ''
                }`}
                onClick={() => onSelectSession(session)}
              >
                <div className="session-info">
                  <div className="session-id">{session.id}</div>
                  <div className="session-directory">
                    {session.directory}
                  </div>
                  <div className="session-permission">
                    {session.permission}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
