import React, { useState, useEffect } from 'react'
import './CLITokenManager.css'

export function CLITokenManager({ isOpen, onClose, authToken, serverUrl }) {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTokenName, setNewTokenName] = useState('')
  const [createdToken, setCreatedToken] = useState(null)
  const [copySuccess, setCopySuccess] = useState('')

  const headers = {
    'Content-Type': 'application/json',
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  // 获取 CLI Token 列表
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
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 创建新的 CLI Token
  const createToken = async () => {
    if (!newTokenName.trim()) {
      setError('请输入 Token 名称')
      return
    }

    try {
      const response = await fetch('/api/cli-tokens', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newTokenName }),
      })
      const data = await response.json()
      if (data.success) {
        setCreatedToken(data)
        fetchTokens()
        setNewTokenName('')
      } else {
        setError(data.message || '创建 Token 失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  // 删除 CLI Token
  const deleteToken = async (token) => {
    if (!confirm(`确定要删除 Token "${token.token}" 吗？此操作不可恢复。`)) {
      return
    }

    try {
      const response = await fetch('/api/cli-tokens', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ token }),
      })
      const data = await response.json()
      if (data.success) {
        fetchTokens()
        if (createdToken && createdToken.token === token) {
          setCreatedToken(null)
        }
      } else {
        setError(data.message || '删除 Token 失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  // 复制安装命令
  const copyInstallCommand = (token) => {
    const baseUrl = serverUrl || window.location.origin
    const installUrl = `${baseUrl}/cli/install.sh`
    const command = `SERVER=${baseUrl} TOKEN=${token} bash -c "$(curl -fsSLk ${installUrl})"`

    navigator.clipboard.writeText(command)
      .then(() => {
        setCopySuccess('已复制!')
        setTimeout(() => setCopySuccess(''), 2000)
      })
      .catch(() => {
        setCopySuccess('复制失败')
        setTimeout(() => setCopySuccess(''), 2000)
      })
  }

  useEffect(() => {
    if (isOpen) {
      fetchTokens()
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal cli-token-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">CLI Token 管理</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* 创建新 Token */}
          <div className="create-token-section">
            <h4>创建新的 CLI Token</h4>
            <div className="create-token-form">
              <input
                type="text"
                className="form-input"
                placeholder="Token 名称（例如：Home-CLI, Work-CLI）"
                value={newTokenName}
                onChange={e => setNewTokenName(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && createToken()}
              />
              <button className="btn btn-primary" onClick={createToken}>
                创建 Token
              </button>
            </div>
          </div>

          {/* 新创建的 Token（高亮显示） */}
          {createdToken && (
            <div className="created-token-alert">
              <div className="alert-icon">🔑</div>
              <div className="alert-content">
                <strong>新 Token 已创建</strong>
                <p>请复制以下安装命令（此 Token 只会显示一次）：</p>
                <code className="install-command">
                  SERVER={serverUrl || window.location.origin} TOKEN={createdToken.token} bash -c "$(curl -fsSLk {serverUrl || window.location.origin}/cli/install.sh)"
                </code>
                <div className="alert-actions">
                  <button
                    className="btn btn-sm"
                    onClick={() => copyInstallCommand(createdToken.token)}
                  >
                    {copySuccess || '复制命令'}
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(createdToken.token)
                      setCopySuccess('已复制!')
                      setTimeout(() => setCopySuccess(''), 2000)
                    }}
                  >
                    仅复制 Token
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Token 列表 */}
          <div className="token-list-section">
            <h4>已创建的 CLI Token</h4>

            {loading ? (
              <div className="loading">加载中...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : tokens.length === 0 ? (
              <div className="empty-state">
                暂无 CLI Token，请创建一个新 Token
              </div>
            ) : (
              <div className="token-list">
                {tokens.map((token, index) => (
                  <div key={index} className="token-item">
                    <div className="token-info">
                      <div className="token-name">
                        {token.is_active && <span className="active-indicator" title="正在使用">●</span>}
                        {token.name}
                      </div>
                      <div className="token-details">
                        <span className="token-value" title={token.token}>
                          {token.token.substring(0, 16)}...
                        </span>
                        <span className="token-meta">
                          {token.last_address && (
                            <span>最后连接：{token.last_address || 'N/A'}</span>
                          )}
                          <span>
                            创建于：{new Date(token.created_at).toLocaleDateString('zh-CN')}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="token-actions">
                      <button
                        className="btn btn-sm btn-copy"
                        onClick={() => copyInstallCommand(token.token)}
                        title="复制安装命令"
                      >
                        复制安装命令
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteToken(token.token)}
                        disabled={token.is_active}
                        title={token.is_active ? '正在使用的 Token 不能删除' : '删除此 Token'}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 使用说明 */}
          <div className="usage-info">
            <h4>使用说明</h4>
            <ol>
              <li>点击"创建 Token"生成一个新的 CLI 专用 Token</li>
              <li>复制安装命令到远程服务器执行</li>
              <li>CLI 会自动连接到此服务器</li>
              <li>可以创建多个 Token 管理不同的 CLI 实例</li>
            </ol>
            <p className="tip">
              💡 <strong>提示：</strong>CLI Token 长期有效，可以分发给多个服务器使用。
              如需撤销某个 Token，点击"删除"即可。
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
