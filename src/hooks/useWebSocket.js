import { useEffect, useRef, useState } from 'react'

export function useWebSocket(url, onMessage) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

  const connect = () => {
    try {
      const ws = new WebSocket(url)
      
      ws.onopen = () => {
        console.log('WebSocket 连接成功')
        setIsConnected(true)
        if (reconnectRef.current) {
          clearTimeout(reconnectRef.current)
          reconnectRef.current = null
        }
      }

      ws.onmessage = (event) => {
        if (onMessage) {
          onMessage(event.data)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket 连接断开')
        setIsConnected(false)
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
  }

  const sendMessage = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket 未连接，无法发送消息')
    }
  }

  useEffect(() => {
    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
      }
    }
  }, [url])

  return {
    isConnected,
    sendMessage
  }
}
