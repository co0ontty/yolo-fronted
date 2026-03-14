import React, { useState, useEffect } from 'react'

export function HelpModal({
  isOpen,
  onClose,
  onManageCLITokens
}) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    const server = window.location.origin
    const fullCommand = `SERVER=${server} TOKEN=<CLI_TOKEN> bash -c "$(curl -fsSLk ${server}/cli/install.sh)"`

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullCommand).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {
        fallbackCopy(fullCommand)
      })
    } else {
      fallbackCopy(fullCommand)
    }
  }

  const fallbackCopy = (text) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
    document.body.removeChild(textArea)
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const server = window.location.origin

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal help-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">帮助</h3>
        </div>

        <div className="modal-body help-body">
          <section className="help-section">
            <div className="help-section-header">
              <span className="help-section-icon">🚀</span>
              <h4>CLI 安装</h4>
            </div>
            <p className="help-desc">在远程机器上安装 CLI 工作器：</p>
            <div className="install-command">
              <code>SERVER={server} TOKEN=&lt;CLI_TOKEN&gt; bash -c "$(curl -fsSLk {server}/cli/install.sh)"</code>
              <button onClick={copyToClipboard} className={`copy-button ${copied ? 'copied' : ''}`}>
                {copied ? '✅' : '📋'}
              </button>
            </div>
            <p className="help-desc" style={{ marginTop: '12px', fontSize: '0.9em', color: '#888' }}>
              💡 请先在侧边栏底部点击「CLI Token 管理」创建 Token，然后替换上述命令中的 &lt;CLI_TOKEN&gt;
            </p>
            {onManageCLITokens && (
              <button
                onClick={() => {
                  onClose()
                  onManageCLITokens()
                }}
                className="btn btn-primary"
                style={{ marginTop: '12px' }}
              >
                打开 CLI Token 管理
              </button>
            )}
          </section>

          <section className="help-section">
            <div className="help-section-header">
              <span className="help-section-icon">⌨️</span>
              <h4>键盘快捷键</h4>
            </div>
            <div className="shortcut-grid">
              <div className="shortcut-item">
                <kbd>Ctrl+K</kbd>
                <span>命令面板</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+N</kbd>
                <span>新建会话</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+X</kbd>
                <span>停止生成</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+?</kbd>
                <span>帮助</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+B</kbd>
                <span>侧边栏</span>
              </div>
              <div className="shortcut-item">
                <kbd>Enter</kbd>
                <span>发送</span>
              </div>
            </div>
          </section>

          <section className="help-section">
            <div className="help-section-header">
              <span className="help-section-icon">📜</span>
              <h4>Slash 命令</h4>
            </div>
            <div className="command-list">
              <div className="command-item">
                <code>/help</code>
                <span>帮助信息</span>
              </div>
              <div className="command-item">
                <code>/new</code>
                <span>创建会话</span>
              </div>
              <div className="command-item">
                <code>/clear</code>
                <span>清空消息</span>
              </div>
              <div className="command-item">
                <code>/export</code>
                <span>导出会话</span>
              </div>
              <div className="command-item">
                <code>/status</code>
                <span>显示状态</span>
              </div>
            </div>
          </section>

          <section className="help-section">
            <div className="help-section-header">
              <span className="help-section-icon">🔐</span>
              <h4>权限模式</h4>
            </div>
            <div className="permission-mode-list">
              <div className="permission-mode-item">
                <span className="mode-badge mode-default">default</span>
                <span>每次操作需确认</span>
              </div>
              <div className="permission-mode-item">
                <span className="mode-badge mode-acceptEdits">acceptEdits</span>
                <span>自动接受编辑</span>
              </div>
              <div className="permission-mode-item">
                <span className="mode-badge mode-yolo">yolo</span>
                <span>完全自动化</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}