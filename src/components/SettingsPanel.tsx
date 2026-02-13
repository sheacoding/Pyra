/**
 * [INPUT]: 依赖 react, react-i18next, ../Icon, ../../types/settings, ../../lib/storage, settings/*
 * [OUTPUT]: 对外提供 SettingsPanel 组件, IDESettings 类型重导出
 * [POS]: components/ 的设置面板入口，纯路由壳 + modal 容器
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from './Icon'
import { type IDESettings, DEFAULT_SETTINGS } from '../types/settings'
import { StorageKeys, loadJSON, saveJSON } from '../lib/storage'
import { EditorSettingsTab } from './settings/EditorSettingsTab'
import { ThemeSettingsTab } from './settings/ThemeSettingsTab'
import { PythonSettingsTab } from './settings/PythonSettingsTab'
import { RuffSettingsTab } from './settings/RuffSettingsTab'
import { GeneralSettingsTab } from './settings/GeneralSettingsTab'
import { LanguageSettingsTab } from './settings/LanguageSettingsTab'

// 重新导出供下游消费者使用
export type { IDESettings } from '../types/settings'

/* ================================================================
 * Tab 类型定义
 * ================================================================ */

type SettingsTab = 'editor' | 'theme' | 'python' | 'ruff' | 'general' | 'language'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  onSettingsChange: (settings: IDESettings) => void
}

/* ================================================================
 * SettingsPanel - 纯路由壳
 * ================================================================ */

export function SettingsPanel({ isOpen, onClose, onSettingsChange }: SettingsPanelProps) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<IDESettings>(DEFAULT_SETTINGS)
  const [activeTab, setActiveTab] = useState<SettingsTab>('editor')

  useEffect(() => {
    const saved = loadJSON<IDESettings>(StorageKeys.SETTINGS)
    if (saved) {
      setSettings({ ...DEFAULT_SETTINGS, ...saved })
    }
  }, [])

  // 统一更新入口 - 一个函数替代 5 个 updateXxxSettings
  const updateField = <S extends keyof IDESettings>(
    section: S,
    key: keyof IDESettings[S],
    value: IDESettings[S][keyof IDESettings[S]],
  ) => {
    const next: IDESettings = {
      ...settings,
      [section]: { ...settings[section], [key]: value },
    }
    setSettings(next)
    saveJSON(StorageKeys.SETTINGS, next)
    onSettingsChange(next)

    // 主题切换时立即更新 DOM
    if (section === 'theme' && (key === 'catppuccinFlavor' || key === 'uiTheme')) {
      const themeValue = key === 'catppuccinFlavor' ? `catppuccin-${value}` : value
      document.documentElement.setAttribute('data-theme', String(themeValue))
      document.body.setAttribute('data-theme', String(themeValue))
    }
  }

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS)
    saveJSON(StorageKeys.SETTINGS, DEFAULT_SETTINGS)
    onSettingsChange(DEFAULT_SETTINGS)
  }

  if (!isOpen) return null

  const tabs: Array<{ key: SettingsTab; label: string }> = [
    { key: 'editor', label: t('settingsPanel.tabs.editor') },
    { key: 'theme', label: t('settingsPanel.tabs.theme') },
    { key: 'python', label: t('settingsPanel.tabs.python') },
    { key: 'ruff', label: t('settingsPanel.tabs.ruff') },
    { key: 'general', label: t('settingsPanel.tabs.general') },
    { key: 'language', label: t('settingsPanel.tabs.language') },
  ]

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="rounded-lg shadow-xl w-4/5 max-w-4xl h-4/5 max-h-screen overflow-hidden" style={{ backgroundColor: 'var(--ctp-mantle)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--ctp-surface1)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--ctp-text)' }}>
            <Icon name="cog" size={20} /> {t('settingsPanel.title')}
          </h2>
          <button onClick={onClose} className="settings-close-btn p-1 rounded transition-colors" style={{ color: 'var(--ctp-subtext1)' }}>
            <Icon name="times" size={16} />
          </button>
        </div>

        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-1/4 p-4 border-r" style={{ backgroundColor: 'var(--ctp-base)', borderColor: 'var(--ctp-surface1)' }}>
            <nav className="space-y-2">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="settings-nav-btn w-full text-left px-3 py-2 rounded transition-colors"
                  style={{
                    backgroundColor: activeTab === key ? 'var(--ctp-blue)' : 'transparent',
                    color: activeTab === key ? 'var(--ctp-base)' : 'var(--ctp-text)',
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="mt-8">
              <button onClick={resetToDefaults} className="settings-reset-btn w-full px-3 py-2 text-sm rounded transition-colors" style={{ backgroundColor: 'var(--ctp-red)', color: 'var(--ctp-base)' }}>
                <Icon name="undo" size={14} /> {t('settingsPanel.resetDefaults')}
              </button>
            </div>
          </div>

          {/* Content - Tab 路由 */}
          <div className="flex-1 p-6 overflow-y-auto" style={{ backgroundColor: 'var(--ctp-base)' }}>
            {activeTab === 'editor' && <EditorSettingsTab settings={settings} onUpdate={(k, v) => updateField('editor', k, v as never)} />}
            {activeTab === 'theme' && <ThemeSettingsTab settings={settings} onUpdate={(k, v) => updateField('theme', k, v as never)} />}
            {activeTab === 'python' && <PythonSettingsTab settings={settings} onUpdate={(k, v) => updateField('python', k, v as never)} />}
            {activeTab === 'ruff' && <RuffSettingsTab settings={settings} onUpdate={(k, v) => updateField('ruff', k, v as never)} />}
            {activeTab === 'general' && <GeneralSettingsTab settings={settings} onUpdate={(k, v) => updateField('general', k, v as never)} />}
            {activeTab === 'language' && <LanguageSettingsTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
