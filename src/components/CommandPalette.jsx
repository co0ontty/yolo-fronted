import React, { useState, useRef, useEffect, useCallback } from 'react'

const COMMANDS = [
  {
    id: 'new_session',
    label: '新建会话',
    description: '创建新的工作会话',
    shortcut: 'Ctrl+N',
    icon: '📝'
  },
  {
    id: 'switch_session',
    label: '切换会话',
    description: '在会话之间切换',
    shortcut: '',
    icon: '🔄'
  },
  {
    id: 'delete_session',
    label: '删除会话',
    description: '删除当前会话',
    shortcut: '',
    icon: '🗑️'
  },
  {
    id: 'help',
    label: '帮助',
    description: '查看帮助文档',
    shortcut: 'Ctrl+?',
    icon: '❓'
  },
  {
    id: 'toggle_sidebar',
    label: '切换侧边栏',
    description: '显示/隐藏侧边栏',
    shortcut: 'Ctrl+B',
    icon: '📋'
  },
  {
    id: 'clear_messages',
    label: '清空消息',
    description: '清空当前会话消息',
    shortcut: '',
    icon: '🧹'
  },
  {
    id: 'export_session',
    label: '导出会话',
    description: '导出会话内容为 Markdown',
    shortcut: '',
    icon: '📤'
  },
  {
    id: 'rename_session',
    label: '重命名会话',
    description: '修改会话目录名称',
    shortcut: '',
    icon: '✏️'
  },
  {
    id: 'copy_last_response',
    label: '复制最后回复',
    description: '复制 AI 的最后一条回复',
    shortcut: '',
    icon: '📋'
  },
  {
    id: 'stop_generation',
    label: '停止生成',
    description: '停止当前的 AI 生成',
    shortcut: 'Ctrl+X',
    icon: '⏹️'
  }
]

export function CommandPalette({ isOpen, onClose, onExecute, sessions, currentSession }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const focusTimeoutRef = useRef(null)

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 重置状态当打开时
  useEffect(() => {
    if (isOpen) {
      // Clear any existing timeout
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current)
      }

      focusTimeoutRef.current = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 50)
      setSearchTerm('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current)
      }
    }
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        onExecute(filteredCommands[selectedIndex].id)
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [filteredCommands, selectedIndex, onExecute, onClose])

  if (!isOpen) return null

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <div className="command-palette-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索命令..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {filteredCommands.length > 0 ? (
          <ul className="command-palette-list">
            {filteredCommands.map((cmd, index) => (
              <li
                key={cmd.id}
                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  onExecute(cmd.id)
                  onClose()
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="command-palette-icon">{cmd.icon}</span>
                <div className="command-palette-content">
                  <div className="command-palette-label">
                    {cmd.label}
                    {cmd.shortcut && (
                      <span className="command-palette-shortcut">{cmd.shortcut}</span>
                    )}
                  </div>
                  <div className="command-palette-description">{cmd.description}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="command-palette-empty">
            <p>没有找到匹配的命令</p>
          </div>
        )}

        <div className="command-palette-footer">
          <span><kbd>↑↓</kbd> 导航</span>
          <span><kbd>Enter</kbd> 执行</span>
          <span><kbd>ESC</kbd> 关闭</span>
        </div>
      </div>
    </div>
  )
}
