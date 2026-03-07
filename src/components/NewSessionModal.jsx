import React, { useState } from 'react'

export function NewSessionModal({
  isOpen,
  onClose,
  onSubmit
}) {
  const [directory, setDirectory] = useState('')
  const [permission, setPermission] = useState('default')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      directory,
      permission
    })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <h2>新建会话</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="directory">工作目录</label>
            <input
              type="text"
              id="directory"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              placeholder="/path/to/project"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="permission">权限模式</label>
            <select
              id="permission"
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              required
            >
              <option value="default">默认模式</option>
              <option value="acceptEdits">自动接受编辑</option>
              <option value="yolo">完全自动化（YOLO）</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              取消
            </button>
            <button type="submit" className="create-button">
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
