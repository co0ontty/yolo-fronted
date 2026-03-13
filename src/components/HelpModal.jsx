import React, { useState, useEffect } from 'react'

export function HelpModal({
  isOpen,
  onClose
}) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    const server = window.location.origin
    const fullCommand = `bash -c "$(curl -fsSLk ${server}/cli/install.sh)"`

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
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content help-modal">
        <h2>帮助</h2>
        <div className="help-content">
          <h3>🚀 CLI 安装</h3>
          <p className="install-desc">在远程机器上安装 CLI 工作器：</p>
          <div className="install-command">
            <code>bash -c "$(curl -fsSLk {server}/cli/install.sh)"</code>
            <button onClick={copyToClipboard} className={`copy-button ${copied ? 'copied' : ''}`}>
              {copied ? '已复制' : '复制'}
            </button>
          </div>

          <h3>⌨️ 键盘快捷键</h3>
          <ul>
            <li><kbd>Ctrl+K</kbd> — 打开命令面板</li>
            <li><kbd>Ctrl+N</kbd> — 新建会话</li>
            <li><kbd>Ctrl+A</kbd> — 切换会话</li>
            <li><kbd>Ctrl+X</kbd> — 停止生成</li>
            <li><kbd>Ctrl+?</kbd> — 打开/关闭帮助</li>
            <li><kbd>Ctrl+B</kbd> — 切换侧边栏</li>
            <li><kbd>Enter</kbd> — 发送消息</li>
            <li><kbd>Shift+Enter</kbd> — 换行</li>
            <li><kbd>/</kbd> — 触发 Slash 命令补全</li>
            <li><kbd>Esc</kbd> — 关闭弹窗/取消补全</li>
          </ul>

          <h3>📜 Slash 命令</h3>
          <ul>
            <li><code>/help</code> — 显示帮助信息</li>
            <li><code>/new</code> — 创建新会话</li>
            <li><code>/switch</code> — 切换会话</li>
            <li><code>/clear</code> — 清空当前会话消息</li>
            <li><code>/export</code> — 导出会话为 Markdown</li>
            <li><code>/retry</code> — 重试最后一条消息</li>
            <li><code>/status</code> — 显示当前状态</li>
            <li><code>/permissions</code> — 查看权限设置</li>
          </ul>

          <h3>🔐 权限模式</h3>
          <ul>
            <li><strong>default</strong> — 每次操作都需要用户确认</li>
            <li><strong>acceptEdits</strong> — 自动接受文件编辑，其他操作需确认</li>
            <li><strong>yolo</strong> — 所有操作自动执行</li>
          </ul>

          <h3>✨ 功能特性</h3>
          <ul>
            <li>📝 支持 Markdown 渲染和代码高亮</li>
            <li>🔧 实时权限申请和工具调用确认</li>
            <li>📊 状态栏显示连接状态和 Token 使用</li>
            <li>🎯 命令面板快速访问常用操作</li>
            <li>💬 流式响应，实时查看 AI 输出</li>
            <li>📤 导出会话内容为 Markdown 文件</li>
            <li>🔄 支持多会话管理</li>
          </ul>

          <h3>📋 命令面板</h3>
          <p className="install-desc">按 <kbd>Ctrl+K</kbd> 打开命令面板，快速执行以下操作：</p>
          <ul>
            <li>📝 新建会话</li>
            <li>🔄 切换会话</li>
            <li>🗑️ 删除会话</li>
            <li>✏️ 重命名会话</li>
            <li>📤 导出会话</li>
            <li>🧹 清空消息</li>
            <li>📋 复制最后回复</li>
            <li>⏹️ 停止生成</li>
            <li>❓ 查看帮助</li>
          </ul>
        </div>
        <button onClick={onClose} className="close-button">
          关闭
        </button>
      </div>
    </div>
  )
}
