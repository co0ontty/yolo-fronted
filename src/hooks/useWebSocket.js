import { useEffect, useRef, useState, useCallback } from 'react'

export function useWebSocket(url, onMessage, authToken, shouldConnect = true) {
  const [isConnected, setIsConnected] = useState(false)
  const [cliConnected, setCliConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)
  const reconnectAttemptRef = useRef(0)
  const shouldReconnectRef = useRef(shouldConnect)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage
  shouldReconnectRef.current = shouldConnect

  const clearReconnectTimer = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current)
      reconnectRef.current = null
    }
  }, [])

  const closeSocket = useCallback(() => {
    if (wsRef.current) {
      const socket = wsRef.current
      wsRef.current = null
      socket.onclose = null
      socket.close()
    }
  }, [])

  const connect = useCallback(() => {
    if (!shouldReconnectRef.current) {
      return
    }
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      // 添加 token 参数到 URL 用于认证
      const separator = url.includes('?') ? '&' : '?'
      const tokenParam = authToken ? `${separator}token=${encodeURIComponent(authToken)}` : ''
      const wsUrl = url + tokenParam

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket 连接成功')
        setIsConnected(true)
        reconnectAttemptRef.current = 0
        clearReconnectTimer()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // 拦截 cli_status 消息
          if (data.type === 'cli_status') {
            const payload = typeof data.content === 'string' ? JSON.parse(data.content) : data.content
            setCliConnected(!!(payload && payload.connected))
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
        wsRef.current = null
        if (!shouldReconnectRef.current) {
          clearReconnectTimer()
          return
        }
        reconnectAttemptRef.current += 1
        const delay = Math.min(3000 * reconnectAttemptRef.current, 15000)
        reconnectRef.current = setTimeout(() => {
          connect()
        }, delay)
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
  }, [authToken, clearReconnectTimer, url])

  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket 未连接，无法发送消息')
    }
  }, [])

  useEffect(() => {
    if (shouldConnect) {
      connect()
    } else {
      clearReconnectTimer()
      closeSocket()
      setIsConnected(false)
      setCliConnected(false)
      reconnectAttemptRef.current = 0
    }

    return () => {
      shouldReconnectRef.current = false
      clearReconnectTimer()
      closeSocket()
    }
  }, [clearReconnectTimer, closeSocket, connect, shouldConnect])

  return {
    isConnected,
    cliConnected,
    sendMessage
  }
}
