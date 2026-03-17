import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getAuthHeaders } from '../utils/api'
import { useModalScrollLock } from '../hooks/useModalScrollLock'

// Debounce hook
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null)

  const debounced = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debounced
}

export function NewSessionModal({
  isOpen,
  onClose,
  onSubmit,
  authToken
}) {
  const [directory, setDirectory] = useState('')
  const [permission, setPermission] = useState('default')

  const [directorySuggestions, setDirectorySuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  // Use custom hook for scroll lock
  useModalScrollLock(isOpen)

  // 获取目录建议
  const fetchDirectorySuggestions = useCallback(async (path) => {
    if (!path) {
      setDirectorySuggestions([])
      return
    }

    setIsLoadingSuggestions(true)
    try {
      const response = await fetch(`/api/list-dirs?path=${encodeURIComponent(path)}`, {
        headers: getAuthHeaders(authToken)
      })
      const data = await response.json()
      if (data.dirs) {
        setDirectorySuggestions(data.dirs)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('获取目录列表失败:', error)
      setDirectorySuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [authToken])

  // Debounced version of fetch
  const debouncedFetch = useDebounce(fetchDirectorySuggestions, 300)

  const handleDirectoryChange = (e) => {
    const value = e.target.value
    setDirectory(value)

    // 当输入 / 或路径结束时，获取建议（debounced）
    if (value.endsWith('/') || value.split('/').length > 1) {
      debouncedFetch(value)
    } else {
      setShowSuggestions(false)
    }
  }

  const selectDirectory = (path) => {
    setDirectory(path + '/')
    setShowSuggestions(false)
    // 继续获取下一级目录
    fetchDirectorySuggestions(path + '/')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!directory.trim()) return
    onSubmit({
      directory: directory.trim(),
      permission
    })
    setDirectory('')
    setPermission('default')
  }

  // 关闭时重置表单
  useEffect(() => {
    if (!isOpen) {
      setDirectory('')
      setPermission('default')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">新建会话</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
             <label htmlFor="directory">工作目录</label>
             <input
               type="text"
               id="directory"
               className="form-input"
               value={directory}
               onChange={handleDirectoryChange}
                placeholder="/path/to/project"
               required
               autoFocus
             />
              {showSuggestions && directorySuggestions.length > 0 && (
                <div className="directory-suggestions">
                  {directorySuggestions.map((dir, index) => (
                    <div
                      key={index}
                      className="directory-suggestion-item"
                      onClick={() => selectDirectory(dir.path)}
                    >
                      📁 {dir.name}
                    </div>
                  ))}
                </div>
              )}
              {isLoadingSuggestions && (
                <div className="directory-loading">加载中...</div>
              )}
           </div>

            <div className="form-group">
              <label htmlFor="permission">权限模式</label>
              <select
                id="permission"
                className="form-select"
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                required
              >
                <option value="default">默认模式（每次请求确认）</option>
                <option value="acceptEdits">自动接受编辑</option>
                <option value="yolo">完全自动化（YOLO）</option>
              </select>
            </div>

            <div className="permission-info">
              <div className={`permission-card ${permission}`}>
                <span className="permission-card-icon">
                  {permission === 'default' ? '🛡️' : permission === 'acceptEdits' ? '✏️' : '🚀'}
                </span>
                <div className="permission-card-content">
                  <span className="permission-card-title">
                    {permission === 'default' ? '默认模式' : permission === 'acceptEdits' ? '自动接受编辑' : 'YOLO 模式'}
                  </span>
                  <span className="permission-card-desc">
                    {permission === 'default' ? '所有操作都需要你的确认' : permission === 'acceptEdits' ? '自动接受文件编辑，其他操作需确认' : '自动执行所有操作，仅建议在可信环境使用'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-btn secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="modal-btn primary">
              创建会话
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
