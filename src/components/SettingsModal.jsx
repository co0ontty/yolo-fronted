import React, { useState, useEffect, useRef, useMemo } from 'react'
import { getAuthHeaders } from '../utils/api'
import { copyToClipboard } from '../utils/clipboard'
import { useModalScrollLock } from '../hooks/useModalScrollLock'

// 生成随机名称
function generateRandomName() {
  const adjectives = ['Swift', 'Brave', 'Calm', 'Eager', 'Fancy', 'Gentle', 'Happy', 'Jolly', 'Kind', 'Lucky', 'Merry', 'Noble', 'Proud', 'Quick', 'Ready', 'Sharp', 'Silent', 'Wise', 'Young', 'Zeal']
  const nouns = ['Ant', 'Bear', 'Cat', 'Dog', 'Eagle', 'Fox', 'Goat', 'Hawk', 'Ibis', 'Jay', 'Koala', 'Lion', 'Mole', 'Newt', 'Owl', 'Panda', 'Quail', 'Rabbit', 'Seal', 'Tiger']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj}${noun}`
}

export function SettingsModal({ isOpen, onClose, authToken, showRawEvents, onToggleRawEvents }) {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createdToken, setCreatedToken] = useState(null)
  const [copySuccess, setCopySuccess] = useState('')
  const copyTimeoutRef = useRef(null)

  const headers = useMemo(() => getAuthHeaders(authToken), [authToken])

  useModalScrollLock(isOpen)

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/cli-tokens', { headers })
      const data = await response.json()
      if (data.success) {
        setTokens(data.tokens || [])
      } else {
        setError(data.message || '获取 Token 列表失败')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  const createToken = async () => {
    const name = generateRandomName()
    try {
      const response = await fetch('/api/cli-tokens', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name }),
      })
      const data = await response.json()
      if (data.success) {
        setCreatedToken(data)
        fetchTokens()
      } else {
        setError(data.message || '创建失败')
      }
    } catch (err) {
      setError('网络错误')
    }
  }

  const deleteToken = async (token) => {
    if (!confirm(`确定删除此 Token？`)) return
    try {
      const response = await fetch('/api/cli-tokens', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ token }),
      })
      const data = await response.json()
      if (data.success) {
        fetchTokens()
        if (createdToken?.token === token) {
          setCreatedToken(null)
        }
      }
    } catch (err) {
      setError('删除失败')
    }
  }

  const getInstallCommand = (token) => {
    const baseUrl = window.location.origin
    return `SERVER=${baseUrl} TOKEN=${token} bash -c "$(curl -fsSLk '${baseUrl}/cli/install.sh')"`
  }

  const handleCopy = async (text) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopySuccess('已复制')
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => setCopySuccess(''), 2000)
    }
  }

  useEffect(() => {
    if (copyTimeoutRef.current) {
      return () => clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setError('')
      setCreatedToken(null)
      fetchTokens()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">设置</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <section className="settings-section">
            <div className="section-header">
              <span className="section-icon">🧪</span>
              <h4>调试显示</h4>
            </div>

            <div className="section-desc">
              面向普通使用时建议关闭原始事件显示，仅在排查输出格式问题时开启。
            </div>

            <label className="allow-session-checkbox">
              <input
                type="checkbox"
                checked={!!showRawEvents}
                onChange={(e) => onToggleRawEvents?.(e.target.checked)}
              />
              <span>显示原始 JSON 事件块</span>
            </label>
          </section>

          <section className="settings-section">
            <div className="section-header">
              <span className="section-icon">🔑</span>
              <h4>CLI Token</h4>
            </div>

            <div className="section-desc">
              创建 Token 用于 CLI 工作器连接。每次创建都会生成新的随机名称。
            </div>

            <button className="btn-create" onClick={createToken}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              创建新 Token
            </button>

            {createdToken && (
              <div className="new-token-card">
                <div className="new-token-header">
                  <span className="new-token-name">{createdToken.name}</span>
                  <span className="new-token-badge">新创建</span>
                </div>
                <div className="install-cmd">
                  <code>{getInstallCommand(createdToken.token)}</code>
                  <button
                    className={`btn-copy ${copySuccess ? 'success' : ''}`}
                    onClick={() => handleCopy(getInstallCommand(createdToken.token))}
                  >
                    {copySuccess || '复制'}
                  </button>
                </div>
                <p className="new-token-hint">请立即复制安装命令，Token 仅显示一次</p>
              </div>
            )}

            <div className="token-list">
              {loading ? (
                <div className="loading-state">加载中...</div>
              ) : error ? (
                <div className="error-state">{error}</div>
              ) : tokens.length === 0 ? (
                <div className="empty-state">暂无 Token</div>
              ) : (
                tokens.map((token, idx) => (
                  <div key={idx} className="token-row">
                    <div className="token-main">
                      <span className="token-name">
                        {token.is_active && <span className="active-dot" />}
                        {token.name}
                      </span>
                      <span className="token-value">{token.token.slice(0, 12)}...</span>
                    </div>
                    <div className="token-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleCopy(getInstallCommand(token.token))}
                        title="复制安装命令"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => deleteToken(token.token)}
                        disabled={token.is_active}
                        title={token.is_active ? '使用中无法删除' : '删除'}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
