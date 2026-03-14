import React from 'react'
import { useModalScrollLock } from '../hooks/useModalScrollLock'

export function HelpModal({ isOpen, onClose }) {
  useModalScrollLock(isOpen)

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal help-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">帮助</h3>
        </div>

        <div className="modal-body help-body">
          <section className="help-section">
            <div className="help-section-header">
              <span className="help-section-icon">⌨️</span>
              <h4>快捷键</h4>
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
                <kbd>Ctrl+B</kbd>
                <span>侧边栏</span>
              </div>
              <div className="shortcut-item">
                <kbd>Enter</kbd>
                <span>发送消息</span>
              </div>
            </div>
          </section>

          <section className="help-section">
            <div className="help-section-header">
              <span className="help-section-icon">💬</span>
              <h4>斜杠命令</h4>
            </div>
            <div className="command-list">
              <div className="command-item">
                <code>/new</code>
                <span>新建会话</span>
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
                <span>查看状态</span>
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