/**
 * [INPUT]: 依赖 react-i18next, ../Icon, ../../types/settings
 * [OUTPUT]: 对外提供 RuffSettingsTab 组件
 * [POS]: settings/ 的 Ruff 设置 tab，被 SettingsPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'
import type { IDESettings } from '../../types/settings'

interface RuffSettingsTabProps {
  settings: IDESettings
  onUpdate: (key: keyof IDESettings['ruff'], value: string | boolean) => void
}

export function RuffSettingsTab({ settings, onUpdate }: RuffSettingsTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ctp-text)' }}>
        <Icon name="search" size={18} /> {t('settingsPanel.ruff.title')}
      </h3>

      <div className="space-y-4">
        {([
          { key: 'enabled', label: t('settingsPanel.ruff.enabled') },
          { key: 'formatOnSave', label: t('settingsPanel.ruff.formatOnSave') },
          { key: 'lintOnSave', label: t('settingsPanel.ruff.lintOnSave') },
        ] as const).map(({ key, label }) => (
          <label key={key} className="flex items-center space-x-2" style={{ color: 'var(--ctp-text)' }}>
            <input
              type="checkbox"
              checked={settings.ruff[key] as boolean}
              onChange={(e) => onUpdate(key, e.target.checked)}
              className="rounded"
              style={{ backgroundColor: 'var(--ctp-surface0)', borderColor: 'var(--ctp-surface1)' }}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>
          {t('settingsPanel.ruff.configPath')}
        </label>
        <input
          type="text"
          value={settings.ruff.configPath}
          onChange={(e) => onUpdate('configPath', e.target.value)}
          className="settings-input w-full px-3 py-2 border rounded"
          placeholder="pyproject.toml"
        />
      </div>
    </div>
  )
}
