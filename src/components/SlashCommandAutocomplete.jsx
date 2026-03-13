import React, { useState, useEffect, useRef } from 'react'

const SLASH_COMMANDS = [
  {
    command: 'help',
    description: '显示帮助信息',
    syntax: '/help'
  },
  {
    command: 'new',
    description: '创建新会话',
    syntax: '/new [目录] [权限模式]'
  },
  {
    command: 'switch',
    description: '切换会话',
    syntax: '/switch <会话 ID>'
  },
  {
    command: 'delete',
    description: '删除会话',
    syntax: '/delete <会话 ID>'
  },
  {
    command: 'rename',
    description: '重命名当前会话',
    syntax: '/rename <新名称>'
  },
  {
    command: 'export',
    description: '导出会话内容',
    syntax: '/export [markdown|json]'
  },
  {
    command: 'clear',
    description: '清空当前会话消息',
    syntax: '/clear'
  },
  {
    command: 'retry',
    description: '重试最后一条消息',
    syntax: '/retry'
  },
  {
    command: 'undo',
    description: '撤销上一次操作',
    syntax: '/undo'
  },
  {
    command: 'status',
    description: '显示当前状态',
    syntax: '/status'
  },
  {
    command: 'models',
    description: '切换模型',
    syntax: '/models'
  },
  {
    command: 'permissions',
    description: '查看权限设置',
    syntax: '/permissions'
  },
  {
    command: 'memory',
    description: '查看项目记忆',
    syntax: '/memory'
  },
  {
    command: 'git',
    description: 'Git 操作',
    syntax: '/git <command>'
  }
]

export function SlashCommandAutocomplete({ 
  inputValue, 
  cursorPosition, 
  onSelect, 
  onClose 
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [filteredCommands, setFilteredCommands] = useState([])
  const containerRef = useRef(null)

  useEffect(() => {
    const textBeforeCursor = inputValue.substring(0, cursorPosition)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines[lines.length - 1]
    
    const slashMatch = currentLine.match(/\/(\w*)$/)
    
    if (slashMatch) {
      const searchTerm = slashMatch[1].toLowerCase()
      const matches = SLASH_COMMANDS.filter(cmd =>
        cmd.command.toLowerCase().startsWith(searchTerm)
      )
      setFilteredCommands(matches)
      setSelectedIndex(0)
    } else {
      setFilteredCommands([])
    }
  }, [inputValue, cursorPosition])

  const handleKeyDown = (e) => {
    if (filteredCommands.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        onSelect(filteredCommands[selectedIndex].command)
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (filteredCommands.length > 0) {
        handleKeyDown(e)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [filteredCommands, selectedIndex])

  if (filteredCommands.length === 0) return null

  return (
    <div className="slash-autocomplete" ref={containerRef}>
      <ul className="slash-command-list">
        {filteredCommands.map((cmd, index) => (
          <li
            key={cmd.command}
            className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => {
              onSelect(cmd.command)
            }}
          >
            <span className="slash-command-name">/{cmd.command}</span>
            <span className="slash-command-description">{cmd.description}</span>
            <span className="slash-command-syntax">{cmd.syntax}</span>
          </li>
        ))}
      </ul>
      <div className="slash-command-footer">
        <kbd>↑↓</kbd> 选择
        <kbd>Enter/Tab</kbd> 插入
        <kbd>ESC</kbd> 关闭
      </div>
    </div>
  )
}
