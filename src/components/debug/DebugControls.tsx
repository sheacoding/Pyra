/**
 * [INPUT]: 依赖 react-i18next, ../Icon
 * [OUTPUT]: 对外提供 DebugControls 组件
 * [POS]: debug/ 的 continue/step 按钮组
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'

interface DebugControlsProps {
  enabled: boolean
  onContinue: () => void
  onStepOver: () => void
  onStepInto: () => void
  onStepOut: () => void
}

export function DebugControls({ enabled, onContinue, onStepOver, onStepInto, onStepOut }: DebugControlsProps) {
  const { t } = useTranslation()

  const buttons = [
    { action: onContinue, icon: 'play', color: 'var(--ctp-green)', title: 'Continue (F5)' },
    { action: onStepOver, icon: 'arrow-right', color: 'var(--ctp-blue)', title: 'Step Over (F10)' },
    { action: onStepInto, icon: 'arrow-down', color: 'var(--ctp-mauve)', title: 'Step Into (F11)' },
    { action: onStepOut, icon: 'arrow-up', color: 'var(--ctp-peach)', title: 'Step Out (Shift+F11)' },
  ]

  return (
    <div className="flex gap-2 p-2 border-b" style={{ borderColor: 'var(--ctp-surface1)' }}>
      {buttons.map(({ action, icon, color, title }) => (
        <button
          key={icon}
          onClick={action}
          disabled={!enabled}
          className="px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
          style={{
            backgroundColor: enabled ? color : 'var(--ctp-surface0)',
            color: enabled ? 'var(--ctp-base)' : 'var(--ctp-overlay0)',
            opacity: enabled ? 1 : 0.5,
          }}
          title={enabled ? title : t('debugPanel.buttonDisabledHint')}
        >
          <Icon name={icon} size={12} />
        </button>
      ))}
    </div>
  )
}
