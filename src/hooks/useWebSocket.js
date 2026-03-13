import { useEffect, useRef, useState, useCallback } from 'react'

export function useWebSocket(url, onMessage, authToken) {
  const [isConnected, setIsConnected] = useState(false)
  const [cliConnected, setCliConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    try {
      // 添加 token 参数到 URL 用于认证
      const separator = url.includes('?') ? '&' : '?'
      const tokenParam = authToken ? `${separator}token=${encodeURIComponent(authToken)}` : ''
      const wsUrl = url + tokenParam

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket 连接成功')
        setIsConnected(true)
        if (reconnectRef.current) {
          clearTimeout(reconnectRef.current)
          reconnectRef.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // 拦截 cli_status 消息
          if (data.type === 'cli_status') {
            setCliConnected(data.content?.connected ?? false)
            return
          }
        } catch (e) {
          // 非 JSON 消息，继续传递
        }
        if (onMessageRef.current) {
          onMessageRef.current(event.data)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket 连接断开')
        setIsConnected(false)
        setCliConnected(false)
        // 自动重连
        reconnectRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket 错误:', error)
        setIsConnected(false)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('建立 WebSocket 连接失败:', error)
      setIsConnected(false)
    }
  }, [url, authToken])

  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket 未连接，无法发送消息')
    }
  }, [])

  useEffect(() => {
    if (authToken) {
      connect()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
      }
    }
  }, [connect, authToken])

  return {
    isConnected,
    cliConnected,
    sendMessage
  }
}
