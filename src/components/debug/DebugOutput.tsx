/**
 * [INPUT]: 依赖 react-i18next, ../../types/debug 的 DebugOutputMessage
 * [OUTPUT]: 对外提供 DebugOutput 组件
 * [POS]: debug/ 的调试输出日志
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslation } from 'react-i18next'
import type { DebugOutputMessage } from '../../types/debug'

interface DebugOutputProps {
  messages: DebugOutputMessage[]
}

export function DebugOutput({ messages }: DebugOutputProps) {
  const { t } = useTranslation()

  const getOutputMeta = (category?: string) => {
    switch (category) {
      case 'stderr':
        return { label: t('debugPanel.outputStderr'), bg: 'rgba(230, 69, 83, 0.25)', color: 'var(--ctp-red)' }
      case 'stdout':
        return { label: t('debugPanel.outputStdout'), bg: 'rgba(166, 227, 161, 0.2)', color: 'var(--ctp-green)' }
      default:
        return { label: t('debugPanel.outputInfo'), bg: 'var(--ctp-surface1)', color: 'var(--ctp-overlay1)' }
    }
  }

  return (
    <div>
      <div className="px-3 py-2 font-semibold text-sm" style={{ color: 'var(--ctp-subtext1)' }}>
        {t('debugPanel.output')}
      </div>
      <div className="px-2 pb-2 flex flex-col gap-1 max-h-48 overflow-auto pr-1">
        {messages.length === 0 ? (
          <div className="text-sm px-2 py-1" style={{ color: 'var(--ctp-overlay0)' }}>
            {t('debugPanel.outputEmpty')}
          </div>
        ) : (
          messages.map(message => {
            const meta = getOutputMeta(message.category)
            return (
              <div
                key={message.id}
                className="px-2 py-1 rounded text-xs flex items-start gap-2"
                style={{ backgroundColor: 'var(--ctp-surface0)', color: 'var(--ctp-text)' }}
              >
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase"
                  style={{ backgroundColor: meta.bg, color: meta.color }}
                >
                  {meta.label}
                </span>
                <span className="flex-1 break-words">{message.content}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
