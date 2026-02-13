/**
 * [INPUT]: 依赖 react, react-i18next, @tauri-apps/api/event, ../lib/tauri, ../types/debug, ./debug/*
 * [OUTPUT]: 对外提供 DebugPanel 组件, DebugOutputMessage 类型重导出
 * [POS]: components/ 的调试面板入口，纯布局壳 + 状态协调
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { listen } from '@tauri-apps/api/event'
import { TauriAPI, type StackFrame, type Scope, type Breakpoint } from '../lib/tauri'
import { Icon } from './Icon'
import type { DebugOutputMessage, DebugState } from '../types/debug'
import { DebugControls } from './debug/DebugControls'
import { DebugCallStack } from './debug/DebugCallStack'
import { DebugVariables } from './debug/DebugVariables'
import { DebugBreakpointList } from './debug/DebugBreakpointList'
import { DebugOutput } from './debug/DebugOutput'

// 重新导出供下游消费者使用
export type { DebugOutputMessage } from '../types/debug'

/* ================================================================
 * Props
 * ================================================================ */

interface DebugPanelProps {
  isVisible: boolean
  isDebugging: boolean
  onClose: () => void
  breakpoints: Breakpoint[]
  outputMessages: DebugOutputMessage[]
  onNavigateToLocation?: (file: string, line: number, column?: number) => void
}

/* ================================================================
 * DebugPanel - 布局壳 + 状态协调
 * ================================================================ */

export function DebugPanel({ isVisible, isDebugging, onClose, breakpoints, outputMessages, onNavigateToLocation }: DebugPanelProps) {
  const { t } = useTranslation()
  const [isPaused, setIsPaused] = useState(false)
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null)
  const [debugState, setDebugState] = useState<DebugState>('idle')
  const [stackFrames, setStackFrames] = useState<StackFrame[]>([])
  const [selectedFrameId, setSelectedFrameId] = useState<number | null>(null)
  const [scopes, setScopes] = useState<Scope[]>([])

  // 计算 debug 状态
  useEffect(() => {
    if (!isVisible) return

    if (isPaused && currentThreadId !== null) {
      setDebugState('paused')
    } else if (isDebugging) {
      setDebugState('running')
    } else {
      setDebugState('idle')
    }
  }, [isVisible, isPaused, currentThreadId, isDebugging])

  // 加载 frame 数据
  const loadFrameData = useCallback(async (frameId: number) => {
    try {
      const frameScopes = await TauriAPI.getScopes(frameId)
      setScopes(frameScopes)
    } catch {
      setScopes([])
    }
  }, [])

  // Debug 步进命令
  const stepCommand = useCallback(async (cmd: 'continue' | 'stepOver' | 'stepInto' | 'stepOut') => {
    if (currentThreadId === null) return
    try {
      const api = {
        continue: TauriAPI.debugContinue,
        stepOver: TauriAPI.debugStepOver,
        stepInto: TauriAPI.debugStepInto,
        stepOut: TauriAPI.debugStepOut,
      }
      await api[cmd](currentThreadId)
      setIsPaused(false)
    } catch {
      // ignore
    }
  }, [currentThreadId])

  // 事件监听（debug-stopped/continued/terminated）
  useEffect(() => {
    let unStopped: (() => void) | undefined
    let unContinued: (() => void) | undefined
    let unTerminated: (() => void) | undefined

    const setup = async () => {
      unStopped = await listen<{ reason: string; threadId: number }>('debug-stopped', async (event) => {
        setIsPaused(true)
        setDebugState('paused')
        setCurrentThreadId(event.payload.threadId)

        try {
          const frames = await TauriAPI.getStackTrace(event.payload.threadId)
          setStackFrames(frames)
          if (frames.length > 0) {
            setSelectedFrameId(frames[0].id)
            const frameScopes = await TauriAPI.getScopes(frames[0].id)
            setScopes(frameScopes)
          } else {
            setSelectedFrameId(null)
            setScopes([])
          }
        } catch {
          setStackFrames([])
          setSelectedFrameId(null)
          setScopes([])
        }
      })

      unContinued = await listen('debug-continued', () => {
        setIsPaused(false)
        setDebugState('running')
      })

      unTerminated = await listen('debug-terminated', () => {
        setIsPaused(false)
        setDebugState('idle')
        setStackFrames([])
        setCurrentThreadId(null)
        setSelectedFrameId(null)
        setScopes([])
      })
    }

    setup()
    return () => { unStopped?.(); unContinued?.(); unTerminated?.() }
  }, [])

  // 快捷键
  useEffect(() => {
    if (!isVisible || !isPaused || currentThreadId === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5' && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); void stepCommand('continue') }
      else if (e.key === 'F10' && !e.shiftKey) { e.preventDefault(); void stepCommand('stepOver') }
      else if (e.key === 'F11' && !e.shiftKey) { e.preventDefault(); void stepCommand('stepInto') }
      else if (e.key === 'F11' && e.shiftKey) { e.preventDefault(); void stepCommand('stepOut') }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, isPaused, currentThreadId, stepCommand])

  // Frame 点击
  const handleFrameClick = async (frame: StackFrame) => {
    setSelectedFrameId(frame.id)
    await loadFrameData(frame.id)
    if (frame.file) onNavigateToLocation?.(frame.file, frame.line, frame.column)
  }

  // 状态指示器
  const statusProps = (() => {
    switch (debugState) {
      case 'idle':
        return { icon: '\u26AA', text: t('debugPanel.statusIdle'), textColor: 'var(--ctp-overlay1)' }
      case 'running':
        return { icon: '\uD83D\uDFE2', text: t('debugPanel.statusRunning'), subText: t('debugPanel.waitingForBreakpoint'), textColor: 'var(--ctp-green)', animate: true }
      case 'paused':
        return { icon: '\u23F8\uFE0F', text: t('debugPanel.statusPaused'), subText: currentThreadId ? `${t('debugPanel.thread')} ${currentThreadId}` : undefined, textColor: 'var(--ctp-peach)' }
    }
  })()

  const controlsEnabled = isPaused && currentThreadId !== null

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--ctp-mantle)', display: isVisible ? 'flex' : 'none' }}>
      {/* Header */}
      <div className="panel-header flex items-center justify-between">
        <h3 className="font-semibold">{t('debugPanel.title')}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-opacity-80 transition-colors" style={{ color: 'var(--ctp-text)' }} title={t('debugPanel.closeHint')}>
          <Icon name="times" size={14} />
        </button>
      </div>

      {/* 状态指示器 */}
      <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--ctp-surface1)', backgroundColor: 'var(--ctp-surface0)' }}>
        <span className={statusProps.animate ? 'debug-status-icon-pulse' : undefined}>{statusProps.icon}</span>
        <div className="flex-1">
          <div className="text-sm font-medium" style={{ color: statusProps.textColor }}>{statusProps.text}</div>
          {statusProps.subText && <div className="text-xs" style={{ color: 'var(--ctp-overlay1)' }}>{statusProps.subText}</div>}
        </div>
      </div>

      {/* Controls */}
      <DebugControls
        enabled={controlsEnabled}
        onContinue={() => void stepCommand('continue')}
        onStepOver={() => void stepCommand('stepOver')}
        onStepInto={() => void stepCommand('stepInto')}
        onStepOut={() => void stepCommand('stepOut')}
      />

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <DebugCallStack frames={stackFrames} selectedFrameId={selectedFrameId} debugState={debugState} onFrameClick={handleFrameClick} />
        <DebugVariables scopes={scopes} debugState={debugState} />
        <DebugBreakpointList breakpoints={breakpoints} onNavigateToLocation={onNavigateToLocation} />
        <DebugOutput messages={outputMessages} />
      </div>
    </div>
  )
}
