/**
 * [INPUT]: 依赖 react-i18next, ../../lib/tauri 的 StackFrame
 * [OUTPUT]: 对外提供 DebugCallStack 组件
 * [POS]: debug/ 的调用栈展示
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslation } from 'react-i18next'
import type { StackFrame } from '../../lib/tauri'
import type { DebugState } from '../../types/debug'

interface DebugCallStackProps {
  frames: StackFrame[]
  selectedFrameId: number | null
  debugState: DebugState
  onFrameClick: (frame: StackFrame) => void
}

export function DebugCallStack({ frames, selectedFrameId, debugState, onFrameClick }: DebugCallStackProps) {
  const { t } = useTranslation()

  return (
    <div className="border-b" style={{ borderColor: 'var(--ctp-surface1)' }}>
      <div className="px-3 py-2 font-semibold text-sm" style={{ color: 'var(--ctp-subtext1)' }}>
        {t('debugPanel.callStack')}
      </div>
      <div className="px-2 pb-2">
        {frames.length === 0 ? (
          <div className="text-sm px-2 py-1" style={{ color: 'var(--ctp-overlay0)' }}>
            {debugState === 'idle' && t('debugPanel.callStackIdle')}
            {debugState === 'running' && t('debugPanel.callStackRunning')}
            {debugState === 'paused' && t('debugPanel.callStackEmpty')}
          </div>
        ) : (
          frames.map(frame => (
            <div
              key={frame.id}
              onClick={() => onFrameClick(frame)}
              className="px-2 py-1 rounded text-sm cursor-pointer transition-colors"
              style={{
                backgroundColor: selectedFrameId === frame.id ? 'var(--ctp-surface1)' : 'transparent',
                color: 'var(--ctp-text)',
              }}
            >
              <div className="font-medium">{frame.name}</div>
              <div className="text-xs" style={{ color: 'var(--ctp-overlay1)' }}>
                {frame.file}:{frame.line}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
