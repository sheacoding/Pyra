/**
 * [INPUT]: 依赖 react, @tauri-apps/api/event, ../lib/tauri, ../types/debug, ../lib/constants
 * [OUTPUT]: 对外提供 DebugProvider, useDebug hook
 * [POS]: contexts/ 的调试状态管理，唯一 debug 事件监听点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { TauriAPI, type Breakpoint } from '../lib/tauri'
import type { DebugOutputMessage, DebugBreakpointEventPayload } from '../types/debug'
import { DEBUG_OUTPUT_LIMIT } from '../lib/constants'

/* ================================================================
 * Context 接口
 * ================================================================ */

interface DebugContextValue {
  isDebugging: boolean
  showDebugPanel: boolean
  debugBreakpoints: Breakpoint[]
  debugOutputMessages: DebugOutputMessage[]
  pendingDebugLocation: { file: string; line: number } | null

  setIsDebugging: (v: boolean) => void
  setShowDebugPanel: (v: boolean) => void
  setDebugBreakpoints: React.Dispatch<React.SetStateAction<Breakpoint[]>>
  setDebugOutputMessages: React.Dispatch<React.SetStateAction<DebugOutputMessage[]>>
  setPendingDebugLocation: (v: { file: string; line: number } | null) => void
  appendDebugOutput: (category: string, content: string) => void
  stopDebugging: () => Promise<void>
  debugStopRequestedRef: React.MutableRefObject<boolean>
}

const DebugContext = createContext<DebugContextValue | null>(null)

/* ================================================================
 * Provider
 * ================================================================ */

interface DebugProviderProps {
  children: ReactNode
  onConsoleOutput: (output: string) => void
  onConsoleError: (error: string) => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export function DebugProvider({ children, onConsoleOutput, onConsoleError, t }: DebugProviderProps) {
  const [isDebugging, setIsDebugging] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [debugBreakpoints, setDebugBreakpoints] = useState<Breakpoint[]>([])
  const [debugOutputMessages, setDebugOutputMessages] = useState<DebugOutputMessage[]>([])
  const [pendingDebugLocation, setPendingDebugLocation] = useState<{ file: string; line: number } | null>(null)
  const debugStopRequestedRef = useRef(false)

  const appendDebugOutput = useCallback((category: string, content: string) => {
    setDebugOutputMessages(prev => {
      const entry: DebugOutputMessage = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        category,
        content,
      }
      const next = [...prev, entry]
      return next.length > DEBUG_OUTPUT_LIMIT
        ? next.slice(next.length - DEBUG_OUTPUT_LIMIT)
        : next
    })
  }, [])

  const stopDebugging = useCallback(async () => {
    debugStopRequestedRef.current = true
    try {
      await TauriAPI.stopDebugSession()
      setIsDebugging(false)
      setShowDebugPanel(false)
      setDebugBreakpoints([])
      setPendingDebugLocation(null)
      const message = t('messages.debugStopped')
      onConsoleOutput(message + '\n')
      appendDebugOutput('info', message)
    } catch {
      debugStopRequestedRef.current = false
    }
  }, [t, onConsoleOutput, appendDebugOutput])

  // 唯一的 debug 事件监听点
  useEffect(() => {
    let unlistenStopped: UnlistenFn | undefined
    let unlistenContinued: UnlistenFn | undefined
    let unlistenTerminated: UnlistenFn | undefined
    let unlistenOutput: UnlistenFn | undefined
    let unlistenBreakpoint: UnlistenFn | undefined

    const setup = async () => {
      unlistenStopped = await listen<{ reason?: string; threadId?: number }>('debug-stopped', () => {
        debugStopRequestedRef.current = false
        setIsDebugging(true)
        setShowDebugPanel(true)
      })

      unlistenContinued = await listen('debug-continued', () => {
        setIsDebugging(true)
      })

      unlistenTerminated = await listen('debug-terminated', () => {
        setIsDebugging(false)
        setShowDebugPanel(false)
        setDebugBreakpoints([])
        setPendingDebugLocation(null)

        if (debugStopRequestedRef.current) {
          debugStopRequestedRef.current = false
        } else {
          const message = t('messages.debugStopped')
          onConsoleOutput(message + '\n')
          appendDebugOutput('info', message)
        }
      })

      unlistenOutput = await listen<{ category?: string; output?: string }>('debug-output', (event) => {
        const { category, output } = event.payload ?? {}
        if (!output) return

        const normalized = output.replace(/\r?\n$/, '')

        if (category === 'stderr') {
          onConsoleError(normalized)
        } else {
          onConsoleOutput(normalized)
        }

        appendDebugOutput(category ?? 'stdout', normalized)
      })

      unlistenBreakpoint = await listen<DebugBreakpointEventPayload>('debug-breakpoint', (event) => {
        const payload = event.payload
        const breakpoint = payload?.breakpoint
        if (!breakpoint) return

        const file = breakpoint.source?.path
        const line = typeof breakpoint.line === 'number' ? breakpoint.line : undefined
        const id = typeof breakpoint.id === 'number' ? breakpoint.id : undefined
        const verified = breakpoint.verified ?? false
        const reason = payload?.reason

        if (reason === 'removed' && (file || id !== undefined)) {
          setDebugBreakpoints(prev =>
            prev.filter(bp => {
              if (id !== undefined && bp.id !== undefined) return bp.id !== id
              if (file && line !== undefined) return !(bp.file === file && bp.line === line)
              return true
            }),
          )
          return
        }

        if (!file || line === undefined) return

        setDebugBreakpoints(prev => {
          const index = prev.findIndex(bp => {
            if (id !== undefined && bp.id !== undefined) return bp.id === id
            return bp.file === file && bp.line === line
          })

          if (index === -1) {
            return [...prev, { file, line, verified, id }]
          }

          const next = [...prev]
          next[index] = {
            ...next[index],
            file,
            line,
            verified,
            id: id ?? next[index].id,
          }
          return next
        })
      })
    }

    setup()

    return () => {
      unlistenStopped?.()
      unlistenContinued?.()
      unlistenTerminated?.()
      unlistenOutput?.()
      unlistenBreakpoint?.()
    }
  }, [appendDebugOutput, onConsoleError, onConsoleOutput, t])

  return (
    <DebugContext.Provider
      value={{
        isDebugging,
        showDebugPanel,
        debugBreakpoints,
        debugOutputMessages,
        pendingDebugLocation,
        setIsDebugging,
        setShowDebugPanel,
        setDebugBreakpoints,
        setDebugOutputMessages,
        setPendingDebugLocation,
        appendDebugOutput,
        stopDebugging,
        debugStopRequestedRef,
      }}
    >
      {children}
    </DebugContext.Provider>
  )
}

/* ================================================================
 * Consumer hook
 * ================================================================ */

export function useDebug(): DebugContextValue {
  const ctx = useContext(DebugContext)
  if (!ctx) {
    throw new Error('useDebug must be used within DebugProvider')
  }
  return ctx
}
