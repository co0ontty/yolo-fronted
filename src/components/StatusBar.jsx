import React from 'react'

export function StatusBar({ 
  isConnected, 
  cliConnected, 
  session, 
  tokenUsage,
  currentModel 
}) {
  const formatTokenCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <div className="status-bar-item connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="status-label">服务器</span>
          <span className={`status-value ${isConnected ? 'status-ok' : 'status-error'}`}>
            {isConnected ? '已连接' : '断开'}
          </span>
        </div>

        <div className="status-bar-item cli-status">
          <span className={`status-dot ${cliConnected ? 'connected' : 'disconnected'}`} />
          <span className="status-label">CLI</span>
          <span className={`status-value ${cliConnected ? 'status-ok' : 'status-error'}`}>
            {cliConnected ? '就绪' : '未连接'}
          </span>
        </div>

        {session && (
          <div className="status-bar-item session-mode">
            <span className="status-dot status-mode" />
            <span className="status-label">模式</span>
            <span className={`status-value mode-${session.permission}`}>
              {session.permission}
            </span>
          </div>
        )}
      </div>

      <div className="status-bar-center">
        {currentModel && (
          <div className="status-bar-item model-info">
            <span className="status-icon">🤖</span>
            <span className="status-value">{currentModel}</span>
          </div>
        )}
      </div>

      <div className="status-bar-right">
        {tokenUsage && (
          <>
            <div className="status-bar-item token-usage">
              <span className="status-icon">📊</span>
              <span className="status-label">输入:</span>
              <span className="status-value">{formatTokenCount(tokenUsage.inputTokens)}</span>
              <span className="status-label">输出:</span>
              <span className="status-value">{formatTokenCount(tokenUsage.outputTokens)}</span>
              <span className="status-label">总计:</span>
              <span className="status-value">{formatTokenCount(tokenUsage.totalTokens)}</span>
            </div>

            {tokenUsage.totalTokens > 0 && (
              <div className="token-progress">
                <div 
                  className="token-progress-bar"
                  style={{ width: `${Math.min((tokenUsage.totalTokens / tokenUsage.contextLimit) * 100, 100)}%` }}
                />
              </div>
            )}
          </>
        )}

        <div className="status-bar-item git-status">
          <span className="status-icon">📦</span>
          <span className="status-value">main</span>
        </div>
      </div>
    </div>
  )
}
