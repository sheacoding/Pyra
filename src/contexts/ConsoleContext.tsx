/**
 * [INPUT]: 依赖 react 的 createContext/useContext/useState/useCallback
 * [OUTPUT]: 对外提供 ConsoleProvider, useConsole hook
 * [POS]: contexts/ 的 console 状态管理，替代 App.tsx 的 consoleMessages prop drilling
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

/* ================================================================
 * Console 消息类型
 * ================================================================ */

interface ConsoleMessage {
  id: string
  content: string
  type: 'stdout' | 'stderr' | 'error' | 'info'
  timestamp: Date
}

/* ================================================================
 * Context 接口
 * ================================================================ */

interface ConsoleContextValue {
  messages: ConsoleMessage[]
  appendOutput: (output: string) => void
  appendError: (error: string) => void
  clear: () => void
}

const ConsoleContext = createContext<ConsoleContextValue | null>(null)

/* ================================================================
 * Provider
 * ================================================================ */

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ConsoleMessage[]>([])

  const appendOutput = useCallback((output: string) => {
    const message: ConsoleMessage = {
      id: Date.now().toString() + Math.random(),
      content: output.replace(/\n$/, ''),
      type: 'stdout',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, message])
  }, [])

  const appendError = useCallback((error: string) => {
    const message: ConsoleMessage = {
      id: Date.now().toString() + Math.random(),
      content: error.replace(/\n$/, ''),
      type: 'error',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, message])
  }, [])

  const clear = useCallback(() => {
    setMessages([])
  }, [])

  return (
    <ConsoleContext.Provider value={{ messages, appendOutput, appendError, clear }}>
      {children}
    </ConsoleContext.Provider>
  )
}

/* ================================================================
 * Consumer hook
 * ================================================================ */

export function useConsole(): ConsoleContextValue {
  const ctx = useContext(ConsoleContext)
  if (!ctx) {
    throw new Error('useConsole must be used within ConsoleProvider')
  }
  return ctx
}
