/**
 * [INPUT]: 依赖 react-i18next, ../Icon, ../../types/settings
 * [OUTPUT]: 对外提供 PythonSettingsTab 组件
 * [POS]: settings/ 的 Python 设置 tab，被 SettingsPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'
import type { IDESettings } from '../../types/settings'

interface PythonSettingsTabProps {
  settings: IDESettings
  onUpdate: (key: keyof IDESettings['python'], value: string | boolean) => void
}

export function PythonSettingsTab({ settings, onUpdate }: PythonSettingsTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ctp-text)' }}>
        <Icon name="python" size={18} color="var(--ctp-blue)" /> {t('settingsPanel.python.title')}
      </h3>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>
            {t('settingsPanel.python.defaultVersion')}
          </label>
          <select
            value={settings.python.defaultVersion}
            onChange={(e) => onUpdate('defaultVersion', e.target.value)}
            className="settings-input w-full px-3 py-2 border rounded"
          >
            <option value="3.12">Python 3.12</option>
            <option value="3.11">Python 3.11</option>
            <option value="3.10">Python 3.10</option>
            <option value="3.9">Python 3.9</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {([
          { key: 'autoCreateVenv', label: t('settingsPanel.python.autoCreateVenv') },
          { key: 'useUV', label: t('settingsPanel.python.useUV') },
        ] as const).map(({ key, label }) => (
          <label key={key} className="flex items-center space-x-2" style={{ color: 'var(--ctp-text)' }}>
            <input
              type="checkbox"
              checked={settings.python[key] as boolean}
              onChange={(e) => onUpdate(key, e.target.checked)}
              className="rounded"
              style={{ backgroundColor: 'var(--ctp-surface0)', borderColor: 'var(--ctp-surface1)' }}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
