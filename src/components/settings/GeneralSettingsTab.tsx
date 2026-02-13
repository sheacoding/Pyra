/**
 * [INPUT]: 依赖 react-i18next, ../Icon, ../../types/settings
 * [OUTPUT]: 对外提供 GeneralSettingsTab 组件
 * [POS]: settings/ 的通用设置 tab，被 SettingsPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'
import type { IDESettings } from '../../types/settings'

interface GeneralSettingsTabProps {
  settings: IDESettings
  onUpdate: (key: keyof IDESettings['general'], value: number | boolean) => void
}

export function GeneralSettingsTab({ settings, onUpdate }: GeneralSettingsTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ctp-text)' }}>
        <Icon name="cog" size={18} /> {t('settingsPanel.general.title')}
      </h3>

      <div className="space-y-4">
        {([
          { key: 'autoSave', label: t('settingsPanel.general.autoSave') },
          { key: 'confirmDelete', label: t('settingsPanel.general.confirmDelete') },
          { key: 'showHiddenFiles', label: t('settingsPanel.general.showHiddenFiles') },
        ] as const).map(({ key, label }) => (
          <label key={key} className="flex items-center space-x-2" style={{ color: 'var(--ctp-text)' }}>
            <input
              type="checkbox"
              checked={settings.general[key] as boolean}
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
          {t('settingsPanel.general.autoSaveDelay')}
        </label>
        <input
          type="number"
          min="500"
          max="10000"
          step="500"
          value={settings.general.autoSaveDelay}
          onChange={(e) => onUpdate('autoSaveDelay', parseInt(e.target.value))}
          className="settings-input w-full px-3 py-2 border rounded"
        />
      </div>
    </div>
  )
}
