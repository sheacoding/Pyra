/**
 * [INPUT]: 依赖 react-i18next, ../Icon, ../../types/settings
 * [OUTPUT]: 对外提供 ThemeSettingsTab 组件
 * [POS]: settings/ 的主题设置 tab，被 SettingsPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'
import type { IDESettings } from '../../types/settings'

interface ThemeSettingsTabProps {
  settings: IDESettings
  onUpdate: (key: keyof IDESettings['theme'], value: string) => void
}

export function ThemeSettingsTab({ settings, onUpdate }: ThemeSettingsTabProps) {
  const { t } = useTranslation()

  const selectFlavor = (flavor: 'mocha' | 'latte') => {
    onUpdate('catppuccinFlavor', flavor)
    onUpdate('editorTheme', `catppuccin-${flavor}`)
    onUpdate('uiTheme', `catppuccin-${flavor}`)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ctp-text)' }}>
        <Icon name="palette" size={18} /> {t('settingsPanel.theme.title')}
      </h3>

      <div className="space-y-6">
        {/* 主题选择器 */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>
            {t('settingsPanel.theme.catppuccinFlavor')}
          </label>
          <div className="grid grid-cols-2 gap-4">
            {/* Mocha 卡片 */}
            <div
              className="settings-theme-card p-4 rounded-lg border-2 cursor-pointer transition-all"
              style={{
                borderColor: settings.theme.catppuccinFlavor === 'mocha' ? 'var(--ctp-mauve)' : 'var(--ctp-surface2)',
                backgroundColor: settings.theme.catppuccinFlavor === 'mocha' ? 'rgba(203, 166, 247, 0.2)' : 'transparent',
              }}
              onClick={() => selectFlavor('mocha')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700" />
                <div>
                  <div className="font-medium" style={{ color: 'var(--ctp-text)' }}>Mocha</div>
                  <div className="text-xs" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.theme.mochaDesc')}</div>
                </div>
              </div>
              <div className="mt-3 flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-red-400" />
              </div>
            </div>

            {/* Latte 卡片 */}
            <div
              className="settings-theme-card p-4 rounded-lg border-2 cursor-pointer transition-all"
              style={{
                borderColor: settings.theme.catppuccinFlavor === 'latte' ? 'var(--ctp-mauve)' : 'var(--ctp-surface2)',
                backgroundColor: settings.theme.catppuccinFlavor === 'latte' ? 'rgba(203, 166, 247, 0.2)' : 'transparent',
              }}
              onClick={() => selectFlavor('latte')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-300 to-purple-500" />
                <div>
                  <div className="font-medium" style={{ color: 'var(--ctp-text)' }}>Latte</div>
                  <div className="text-xs" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.theme.latteDesc')}</div>
                </div>
              </div>
              <div className="mt-3 flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-purple-600" />
                <div className="w-3 h-3 rounded-full bg-green-600" />
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <div className="w-3 h-3 rounded-full bg-yellow-600" />
                <div className="w-3 h-3 rounded-full bg-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 主题预览 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--ctp-surface0)' }}>
          <h4 className="text-md font-medium mb-3" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.theme.preview')}</h4>
          <div className="rounded p-3 font-mono text-sm" style={{ backgroundColor: 'var(--ctp-mantle)' }}>
            <div style={{ color: 'var(--ctp-mauve)' }}>{t('settingsPanel.theme.comment')}</div>
            <div style={{ color: 'var(--ctp-blue)' }}>
              {t('settingsPanel.theme.function')} <span style={{ color: 'var(--ctp-yellow)' }}>{t('settingsPanel.theme.functionName')}</span>():
            </div>
            <div className="ml-4" style={{ color: 'var(--ctp-green)' }}>{t('settingsPanel.theme.string')}</div>
            <div className="ml-4" style={{ color: 'var(--ctp-peach)' }}>
              {t('settingsPanel.theme.print')}(<span style={{ color: 'var(--ctp-green)' }}>{t('settingsPanel.theme.welcome')}</span>)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
