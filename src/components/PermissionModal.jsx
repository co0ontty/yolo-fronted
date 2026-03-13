import React, { useState } from 'react'

export function PermissionModal({ isOpen, request, onRespond }) {
  const [allowSession, setAllowSession] = useState(false)

  if (!isOpen || !request) return null

  const getPermissionIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'file_edit':
      case 'edit':
        return '✏️'
      case 'file_read':
      case 'read':
        return '📄'
      case 'command_run':
      case 'bash':
      case 'exec':
        return '💻'
      case 'network':
      case 'fetch':
        return '🌐'
      case 'write':
        return '📝'
      case 'delete':
        return '🗑️'
      case 'git':
        return '📦'
      default:
        return '🔐'
    }
  }

  const handleGrant = () => {
    onRespond(request.requestId, true, allowSession)
  }

  const handleDeny = () => {
    onRespond(request.requestId, false, false)
  }

  return (
    <div className="modal-overlay" onClick={() => onRespond(request.requestId, false, false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-title-icon">{getPermissionIcon(request.permission)}</span>
            <h3 className="modal-title">权限请求</h3>
          </div>
          <span className={`nav-badge mode-${request.permission}`}>
            {request.permission}
          </span>
        </div>

        <div className="modal-body">
          <div className="permission-section">
            <span className="permission-section-label">请求说明</span>
            <p className="permission-description">{request.description}</p>
          </div>

          {request.toolName && (
            <div className="permission-section">
              <span className="permission-section-label">使用工具</span>
              <code className="permission-code">{request.toolName}</code>
            </div>
          )}

          {request.command && (
            <div className="permission-section">
              <span className="permission-section-label">执行命令</span>
              <pre className="permission-code-block">{request.command}</pre>
            </div>
          )}

          {request.filePath && (
            <div className="permission-section">
              <span className="permission-section-label">文件路径</span>
              <code className="permission-code-block">{request.filePath}</code>
            </div>
          )}

          {request.details && (
            <div className="permission-section">
              <span className="permission-section-label">详细信息</span>
              <pre className="permission-code-block">{request.details}</pre>
            </div>
          )}

          <label className="allow-session-checkbox">
            <input
              type="checkbox"
              checked={allowSession}
              onChange={(e) => setAllowSession(e.target.checked)}
            />
            <span>本次会话不再询问此类型请求</span>
          </label>
        </div>

        <div className="modal-footer">
          <button className="modal-btn danger" onClick={handleDeny}>
            拒绝
          </button>
          <button className="modal-btn primary" onClick={handleGrant}>
            允许
          </button>
        </div>
      </div>
    </div>
  )
}
