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

  const getPermissionClass = (type) => {
    return `permission-type type-${type?.toLowerCase() || 'unknown'}`
  }

  const getPermissionColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'file_edit':
      case 'edit':
      case 'write':
        return 'warning'
      case 'command_run':
      case 'bash':
      case 'exec':
        return 'danger'
      case 'network':
      case 'fetch':
        return 'info'
      case 'delete':
        return 'danger'
      case 'git':
        return 'primary'
      default:
        return 'default'
    }
  }

  const handleGrant = () => {
    onRespond(request.requestId, true, allowSession)
  }

  const handleDeny = () => {
    onRespond(request.requestId, false, false)
  }

  const permissionColor = getPermissionColor(request.permission)

  return (
    <div className="permission-modal-overlay">
      <div className={`permission-modal permission-${permissionColor}`}>
        <div className="permission-modal-header">
          <span className="permission-icon">
            {getPermissionIcon(request.permission)}
          </span>
          <div className="permission-header-content">
            <h3>权限请求</h3>
            <span className={`permission-badge badge-${permissionColor}`}>
              {request.permission}
            </span>
          </div>
        </div>

        <div className="permission-modal-body">
          <div className={getPermissionClass(request.permission)}>
            <span className="permission-label">请求类型</span>
            <span className="permission-value">{request.permission}</span>
          </div>

          {request.toolName && (
            <div className="permission-tool-info">
              <span className="permission-label">工具</span>
              <code>{request.toolName}</code>
            </div>
          )}

          <div className="permission-description">
            <span className="permission-label">描述</span>
            <p>{request.description}</p>
          </div>

          {request.details && (
            <div className="permission-details">
              <span className="permission-label">详细信息</span>
              <pre className="permission-details-content">{request.details}</pre>
            </div>
          )}

          {request.command && (
            <div className="permission-command">
              <span className="permission-label">执行命令</span>
              <code className="command-code">{request.command}</code>
            </div>
          )}

          {request.filePath && (
            <div className="permission-file-path">
              <span className="permission-label">文件路径</span>
              <code className="file-path-code">{request.filePath}</code>
            </div>
          )}
        </div>

        <div className="permission-modal-footer">
          <label className="allow-session-checkbox">
            <input
              type="checkbox"
              checked={allowSession}
              onChange={(e) => setAllowSession(e.target.checked)}
            />
            <span>本次会话不再询问</span>
          </label>
          
          <div className="permission-actions">
            <button className="btn-deny" onClick={handleDeny}>
              <span>🚫</span> 拒绝
            </button>
            <button className="btn-grant" onClick={handleGrant}>
              <span>✅</span> 允许
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
