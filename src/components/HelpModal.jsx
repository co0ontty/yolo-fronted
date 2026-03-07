import React, { useState } from 'react'

export function HelpModal({
  isOpen,
  onClose
}) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    const server = window.location.origin
    const fullCommand = `curl -fsSL ${server}/cli/install.sh | VIBE_SERVER=${server} bash`
    navigator.clipboard.writeText(fullCommand).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!isOpen) return null

  const server = window.location.origin

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content help-modal">
        <h2>帮助</h2>
        <div className="help-content">
          <h3>CLI 安装</h3>
          <p className="install-desc">在远程机器上安装 CLI 工作器：</p>
          <div className="install-command">
            <code>curl -fsSL {server}/cli/install.sh | VIBE_SERVER={server} bash</code>
            <button onClick={copyToClipboard} className={`copy-button ${copied ? 'copied' : ''}`}>
              {copied ? '已复制' : '复制'}
            </button>
          </div>

          <h3>快速开始</h3>
          <ol>
            <li>点击 <strong>+ 新会话</strong> 创建一个新的工作会话</li>
            <li>输入工作目录和权限模式</li>
            <li>点击 <strong>创建</strong> 按钮</li>
            <li>在聊天窗口中输入消息开始与 AI 交互</li>
          </ol>

          <h3>权限模式说明</h3>
          <ul>
            <li><strong>默认模式</strong> — 每次操作都需要用户确认</li>
            <li><strong>自动接受编辑</strong> — 自动接受文件编辑，其他操作需确认</li>
            <li><strong>完全自动化（YOLO）</strong> — 所有操作自动执行</li>
          </ul>

          <h3>支持的操作</h3>
          <ul>
            <li>文件查看和编辑</li>
            <li>命令执行</li>
            <li>代码搜索</li>
            <li>文件系统导航</li>
          </ul>
        </div>
        <button onClick={onClose} className="close-button">
          关闭
        </button>
      </div>
    </div>
  )
}
