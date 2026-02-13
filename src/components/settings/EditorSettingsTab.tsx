/**
 * [INPUT]: 依赖 react-i18next, ../Icon, ../../types/settings
 * [OUTPUT]: 对外提供 EditorSettingsTab 组件
 * [POS]: settings/ 的编辑器设置 tab，被 SettingsPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'
import type { IDESettings } from '../../types/settings'

interface EditorSettingsTabProps {
  settings: IDESettings
  onUpdate: (key: keyof IDESettings['editor'], value: string | number | boolean) => void
}

export function EditorSettingsTab({ settings, onUpdate }: EditorSettingsTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ctp-text)' }}>
        <Icon name="edit" size={18} /> {t('settingsPanel.editor.title')}
      </h3>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>
            {t('settingsPanel.editor.fontSize')}
          </label>
          <input
            type="number"
            min="10"
            max="24"
            value={settings.editor.fontSize}
            onChange={(e) => onUpdate('fontSize', parseInt(e.target.value))}
            className="settings-input w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>
            {t('settingsPanel.editor.tabSize')}
          </label>
          <select
            value={settings.editor.tabSize}
            onChange={(e) => onUpdate('tabSize', parseInt(e.target.value))}
            className="settings-input w-full px-3 py-2 border rounded"
          >
            <option value={2}>{t('settingsPanel.editor.spaces', { count: 2 })}</option>
            <option value={4}>{t('settingsPanel.editor.spaces', { count: 4 })}</option>
            <option value={8}>{t('settingsPanel.editor.spaces', { count: 8 })}</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>
            {t('settingsPanel.editor.fontFamily')}
          </label>
          <input
            type="text"
            value={settings.editor.fontFamily}
            onChange={(e) => onUpdate('fontFamily', e.target.value)}
            className="settings-input w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {([
          { key: 'lineNumbers', label: t('settingsPanel.editor.showLineNumbers') },
          { key: 'wordWrap', label: t('settingsPanel.editor.wordWrap') },
          { key: 'minimap', label: t('settingsPanel.editor.showMinimap') },
          { key: 'renderWhitespace', label: t('settingsPanel.editor.showWhitespace') },
          { key: 'insertSpaces', label: t('settingsPanel.editor.insertSpaces') },
        ] as const).map(({ key, label }) => (
          <label key={key} className="flex items-center space-x-2" style={{ color: 'var(--ctp-text)' }}>
            <input
              type="checkbox"
              checked={settings.editor[key] as boolean}
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
