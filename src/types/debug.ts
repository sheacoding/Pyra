/**
 * [INPUT]: 依赖 ../lib/tauri 的 Breakpoint 类型
 * [OUTPUT]: 对外提供 DebugOutputMessage, DebugState, DebugBreakpointEventPayload
 * [POS]: types/ 的调试类型定义，被 DebugContext 和 DebugPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ================================================================
 * 调试输出消息
 * ================================================================ */

export interface DebugOutputMessage {
  id: string
  category: string
  content: string
}

/* ================================================================
 * 调试状态机
 * ================================================================ */

export type DebugState = 'idle' | 'running' | 'paused'

/* ================================================================
 * 调试断点事件 payload（来自 Tauri 后端）
 * ================================================================ */

export interface DebugBreakpointEventPayload {
  reason?: string
  breakpoint?: {
    id?: number
    verified?: boolean
    line?: number
    column?: number
    source?: {
      path?: string
    }
  }
}
