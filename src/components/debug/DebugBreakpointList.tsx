/**
 * [INPUT]: 依赖 react-i18next, ../../lib/tauri 的 Breakpoint, ../Icon
 * [OUTPUT]: 对外提供 DebugBreakpointList 组件
 * [POS]: debug/ 的断点列表
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslation } from 'react-i18next'
import type { Breakpoint } from '../../lib/tauri'
import { Icon } from '../Icon'

interface DebugBreakpointListProps {
  breakpoints: Breakpoint[]
  onNavigateToLocation?: (file: string, line: number, column?: number) => void
}

export function DebugBreakpointList({ breakpoints, onNavigateToLocation }: DebugBreakpointListProps) {
  const { t } = useTranslation()

  const formatFileLabel = (path: string) => {
    if (!path) return t('debugPanel.unknownFile')
    const segments = path.split(/[/\\]/)
    return segments[segments.length - 1] || path
  }

  const handleClick = (bp: Breakpoint) => {
    if (!bp.file) return
    onNavigateToLocation?.(bp.file, bp.line, 1)
  }

  return (
    <div className="border-b" style={{ borderColor: 'var(--ctp-surface1)' }}>
      <div className="px-3 py-2 font-semibold text-sm" style={{ color: 'var(--ctp-subtext1)' }}>
        {t('debugPanel.breakpoints')}
      </div>
      <div className="px-2 pb-2 flex flex-col gap-1">
        {breakpoints.length === 0 ? (
          <div className="text-sm px-2 py-1" style={{ color: 'var(--ctp-overlay0)' }}>
            {t('debugPanel.noBreakpoints')}
          </div>
        ) : (
          breakpoints.map(bp => (
            <button
              key={`${bp.file}:${bp.line}:${bp.id ?? 'n/a'}`}
              onClick={() => handleClick(bp)}
              className="w-full text-left px-2 py-1 rounded text-sm transition-colors flex gap-2 items-start"
              style={{ backgroundColor: 'transparent', color: 'var(--ctp-text)' }}
            >
              <Icon
                name={bp.verified ? 'check-circle' : 'clock'}
                size={14}
                color={bp.verified ? 'var(--ctp-green)' : 'var(--ctp-yellow)'}
              />
              <div className="flex-1">
                <div className="font-medium break-words">{formatFileLabel(bp.file)}</div>
                <div className="text-xs" style={{ color: 'var(--ctp-overlay1)' }}>
                  {bp.file}:{bp.line}
                </div>
                <div className="text-xs" style={{ color: bp.verified ? 'var(--ctp-green)' : 'var(--ctp-yellow)' }}>
                  {bp.verified ? t('debugPanel.breakpointVerified') : t('debugPanel.breakpointPending')}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
