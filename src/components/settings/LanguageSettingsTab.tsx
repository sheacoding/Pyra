/**
 * [INPUT]: 依赖 react-i18next, ../Icon, ../../lib/storage
 * [OUTPUT]: 对外提供 LanguageSettingsTab 组件
 * [POS]: settings/ 的语言设置 tab，被 SettingsPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'
import { StorageKeys, saveString } from '../../lib/storage'

export function LanguageSettingsTab() {
  const { t, i18n } = useTranslation()

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang)
    saveString(StorageKeys.LANGUAGE, lang)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ctp-text)' }}>
        <Icon name="language" size={18} /> {t('settingsPanel.language.title')}
      </h3>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>
          {t('settingsPanel.language.selectLanguage')}
        </label>
        <select
          value={i18n.language}
          onChange={(e) => changeLanguage(e.target.value)}
          className="settings-input w-full px-3 py-2 border rounded"
        >
          <option value="en">{t('settingsPanel.language.english')}</option>
          <option value="zh-CN">{t('settingsPanel.language.chineseSimplified')}</option>
        </select>
      </div>

      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--ctp-surface0)' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--ctp-subtext1)' }}>
          <Icon name="info-circle" size={14} />
          <span className="text-sm">{t('settingsPanel.language.restartHint')}</span>
        </div>
      </div>

      <div className="p-4 rounded-lg border-2" style={{
        borderColor: 'var(--ctp-surface2)',
        backgroundColor: 'var(--ctp-mantle)',
      }}>
        <h4 className="text-md font-medium mb-3" style={{ color: 'var(--ctp-subtext1)' }}>
          {i18n.language === 'zh-CN' ? '\u5F53\u524D\u8BED\u8A00' : 'Current Language'}
        </h4>
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            {i18n.language === 'zh-CN' ? '\uD83C\uDDE8\uD83C\uDDF3' : '\uD83C\uDDEC\uD83C\uDDE7'}
          </div>
          <div>
            <div className="font-semibold" style={{ color: 'var(--ctp-text)' }}>
              {i18n.language === 'zh-CN' ? '\u7B80\u4F53\u4E2D\u6587' : 'English'}
            </div>
            <div className="text-xs" style={{ color: 'var(--ctp-subtext1)' }}>
              {i18n.language === 'zh-CN' ? 'Simplified Chinese' : 'English (US)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
