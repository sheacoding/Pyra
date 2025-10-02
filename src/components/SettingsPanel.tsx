import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CatppuccinFlavor } from '../themes/catppuccin'

export interface IDESettings {
  editor: {
    fontSize: number
    fontFamily: string
    lineNumbers: boolean
    wordWrap: boolean
    minimap: boolean
    renderWhitespace: boolean
    tabSize: number
    insertSpaces: boolean
  }
  theme: {
    editorTheme: 'catppuccin-mocha' | 'catppuccin-latte'
    uiTheme: 'catppuccin-mocha' | 'catppuccin-latte'
    catppuccinFlavor: CatppuccinFlavor
  }
  python: {
    defaultVersion: string
    autoCreateVenv: boolean
    useUV: boolean
  }
  ruff: {
    enabled: boolean
    formatOnSave: boolean
    lintOnSave: boolean
    configPath: string
  }
  general: {
    autoSave: boolean
    autoSaveDelay: number
    confirmDelete: boolean
    showHiddenFiles: boolean
  }
}

const defaultSettings: IDESettings = {
  editor: {
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, monospace',
    lineNumbers: true,
    wordWrap: true,
    minimap: false,
    renderWhitespace: false,
    tabSize: 4,
    insertSpaces: true
  },
  theme: {
    editorTheme: 'catppuccin-mocha',
    uiTheme: 'catppuccin-mocha',
    catppuccinFlavor: 'mocha'
  },
  python: {
    defaultVersion: '3.11',
    autoCreateVenv: true,
    useUV: true
  },
  ruff: {
    enabled: true,
    formatOnSave: false,
    lintOnSave: true,
    configPath: 'pyproject.toml'
  },
  general: {
    autoSave: true,
    autoSaveDelay: 2000,
    confirmDelete: true,
    showHiddenFiles: false
  }
}

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  onSettingsChange: (settings: IDESettings) => void
}

export function SettingsPanel({ isOpen, onClose, onSettingsChange }: SettingsPanelProps) {
  const { t, i18n } = useTranslation()
  const [settings, setSettings] = useState<IDESettings>(defaultSettings)
  const [activeTab, setActiveTab] = useState<'editor' | 'theme' | 'python' | 'ruff' | 'general' | 'language'>('editor')

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pyra-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
      }
    }
  }, [])

  // Save settings to localStorage and notify parent
  const updateSettings = (newSettings: IDESettings) => {
    setSettings(newSettings)
    localStorage.setItem('pyra-settings', JSON.stringify(newSettings))
    onSettingsChange(newSettings)
  }

  const updateEditorSettings = (key: keyof IDESettings['editor'], value: any) => {
    const newSettings = {
      ...settings,
      editor: { ...settings.editor, [key]: value }
    }
    updateSettings(newSettings)
  }

  const updateThemeSettings = (key: keyof IDESettings['theme'], value: any) => {
    const newSettings = {
      ...settings,
      theme: { ...settings.theme, [key]: value }
    }
    updateSettings(newSettings)

    // Force CSS theme update immediately
    if (key === 'catppuccinFlavor' || key === 'uiTheme') {
      const themeValue = key === 'catppuccinFlavor' ? `catppuccin-${value}` : value
      document.documentElement.setAttribute('data-theme', themeValue)
      document.body.setAttribute('data-theme', themeValue)
    }
  }

  const updatePythonSettings = (key: keyof IDESettings['python'], value: any) => {
    const newSettings = {
      ...settings,
      python: { ...settings.python, [key]: value }
    }
    updateSettings(newSettings)
  }

  const updateRuffSettings = (key: keyof IDESettings['ruff'], value: any) => {
    const newSettings = {
      ...settings,
      ruff: { ...settings.ruff, [key]: value }
    }
    updateSettings(newSettings)
  }

  const updateGeneralSettings = (key: keyof IDESettings['general'], value: any) => {
    const newSettings = {
      ...settings,
      general: { ...settings.general, [key]: value }
    }
    updateSettings(newSettings)
  }

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang)
    localStorage.setItem('i18nextLng', lang)
  }

  const resetToDefaults = () => {
    updateSettings(defaultSettings)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div className="rounded-lg shadow-xl w-4/5 max-w-4xl h-4/5 max-h-screen overflow-hidden" style={{
        backgroundColor: 'var(--ctp-mantle)'
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{
          borderColor: 'var(--ctp-surface1)'
        }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--ctp-text)' }}><i className="fas fa-cog"></i> {t('settingsPanel.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{
              color: 'var(--ctp-subtext1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--ctp-text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--ctp-subtext1)'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-1/4 p-4 border-r" style={{
            backgroundColor: 'var(--ctp-base)',
            borderColor: 'var(--ctp-surface1)'
          }}>
            <nav className="space-y-2">
              {[
                { key: 'editor', label: t('settingsPanel.tabs.editor'), icon: 'fas fa-edit' },
                { key: 'theme', label: t('settingsPanel.tabs.theme'), icon: 'fas fa-palette' },
                { key: 'python', label: t('settingsPanel.tabs.python'), icon: 'fab fa-python' },
                { key: 'ruff', label: t('settingsPanel.tabs.ruff'), icon: 'fas fa-search' },
                { key: 'general', label: t('settingsPanel.tabs.general'), icon: 'fas fa-cog' },
                { key: 'language', label: t('settingsPanel.tabs.language'), icon: 'fas fa-language' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className="w-full text-left px-3 py-2 rounded transition-colors"
                  style={{
                    backgroundColor: activeTab === key ? 'var(--ctp-blue)' : 'transparent',
                    color: activeTab === key ? 'var(--ctp-base)' : 'var(--ctp-text)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== key) {
                      e.currentTarget.style.backgroundColor = 'var(--ctp-surface0)'
                      e.currentTarget.style.color = 'var(--ctp-text)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== key) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'var(--ctp-text)'
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="mt-8">
              <button
                onClick={resetToDefaults}
                className="w-full px-3 py-2 text-sm rounded transition-colors"
                style={{
                  backgroundColor: 'var(--ctp-red)',
                  color: 'var(--ctp-base)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--ctp-maroon)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--ctp-red)'
                }}
              >
                <i className="fas fa-undo"></i> {t('settingsPanel.resetDefaults')}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto" style={{
            backgroundColor: 'var(--ctp-base)'
          }}>
            {activeTab === 'editor' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ctp-text)' }}><i className="fas fa-edit"></i> {t('settingsPanel.editor.title')}</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.editor.fontSize')}</label>
                    <input
                      type="number"
                      min="10"
                      max="24"
                      value={settings.editor.fontSize}
                      onChange={(e) => updateEditorSettings('fontSize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded"
                      style={{
                        backgroundColor: 'var(--ctp-surface0)',
                        borderColor: 'var(--ctp-surface1)',
                        color: 'var(--ctp-text)'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--ctp-blue)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--ctp-surface1)'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.editor.tabSize')}</label>
                    <select
                      value={settings.editor.tabSize}
                      onChange={(e) => updateEditorSettings('tabSize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded"
                      style={{
                        backgroundColor: 'var(--ctp-surface0)',
                        borderColor: 'var(--ctp-surface1)',
                        color: 'var(--ctp-text)'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--ctp-blue)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--ctp-surface1)'
                      }}
                    >
                      <option value={2}>{t('settingsPanel.editor.spaces', { count: 2 })}</option>
                      <option value={4}>{t('settingsPanel.editor.spaces', { count: 4 })}</option>
                      <option value={8}>{t('settingsPanel.editor.spaces', { count: 8 })}</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.editor.fontFamily')}</label>
                    <input
                      type="text"
                      value={settings.editor.fontFamily}
                      onChange={(e) => updateEditorSettings('fontFamily', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      style={{
                        backgroundColor: 'var(--ctp-surface0)',
                        borderColor: 'var(--ctp-surface1)',
                        color: 'var(--ctp-text)'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--ctp-blue)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--ctp-surface1)'
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'lineNumbers', label: t('settingsPanel.editor.showLineNumbers') },
                    { key: 'wordWrap', label: t('settingsPanel.editor.wordWrap') },
                    { key: 'minimap', label: t('settingsPanel.editor.showMinimap') },
                    { key: 'renderWhitespace', label: t('settingsPanel.editor.showWhitespace') },
                    { key: 'insertSpaces', label: t('settingsPanel.editor.insertSpaces') }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2" style={{ color: 'var(--ctp-text)' }}>
                      <input
                        type="checkbox"
                        checked={settings.editor[key as keyof IDESettings['editor']] as boolean}
                        onChange={(e) => updateEditorSettings(key as any, e.target.checked)}
                        className="rounded"
                        style={{
                          backgroundColor: 'var(--ctp-surface0)',
                          borderColor: 'var(--ctp-surface1)'
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ctp-text)' }}><i className="fas fa-palette"></i> {t('settingsPanel.theme.title')}</h3>

                <div className="space-y-6">
                  {/* Catppuccin Theme Selector */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.theme.catppuccinFlavor')}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="p-4 rounded-lg border-2 cursor-pointer transition-all"
                        style={{
                          borderColor: settings.theme.catppuccinFlavor === 'mocha'
                            ? 'var(--ctp-mauve)'
                            : 'var(--ctp-surface2)',
                          backgroundColor: settings.theme.catppuccinFlavor === 'mocha'
                            ? 'rgba(203, 166, 247, 0.2)'
                            : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (settings.theme.catppuccinFlavor !== 'mocha') {
                            e.currentTarget.style.borderColor = 'var(--ctp-surface1)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (settings.theme.catppuccinFlavor !== 'mocha') {
                            e.currentTarget.style.borderColor = 'var(--ctp-surface2)'
                          }
                        }}
                        onClick={() => {
                          updateThemeSettings('catppuccinFlavor', 'mocha')
                          updateThemeSettings('editorTheme', 'catppuccin-mocha')
                          updateThemeSettings('uiTheme', 'catppuccin-mocha')
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700"></div>
                          <div>
                            <div className="font-medium" style={{ color: 'var(--ctp-text)' }}>Mocha</div>
                            <div className="text-xs" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.theme.mochaDesc')}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-1">
                          <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        </div>
                      </div>

                      <div
                        className="p-4 rounded-lg border-2 cursor-pointer transition-all"
                        style={{
                          borderColor: settings.theme.catppuccinFlavor === 'latte'
                            ? 'var(--ctp-mauve)'
                            : 'var(--ctp-surface2)',
                          backgroundColor: settings.theme.catppuccinFlavor === 'latte'
                            ? 'rgba(203, 166, 247, 0.2)'
                            : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (settings.theme.catppuccinFlavor !== 'latte') {
                            e.currentTarget.style.borderColor = 'var(--ctp-surface1)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (settings.theme.catppuccinFlavor !== 'latte') {
                            e.currentTarget.style.borderColor = 'var(--ctp-surface2)'
                          }
                        }}
                        onClick={() => {
                          updateThemeSettings('catppuccinFlavor', 'latte')
                          updateThemeSettings('editorTheme', 'catppuccin-latte')
                          updateThemeSettings('uiTheme', 'catppuccin-latte')
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-300 to-purple-500"></div>
                          <div>
                            <div className="font-medium" style={{ color: 'var(--ctp-text)' }}>Latte</div>
                            <div className="text-xs" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.theme.latteDesc')}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-1">
                          <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                          <div className="w-3 h-3 rounded-full bg-green-600"></div>
                          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                          <div className="w-3 h-3 rounded-full bg-red-600"></div>
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Theme Preview */}
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--ctp-surface0)' }}>
                    <h4 className="text-md font-medium mb-3" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.theme.preview')}</h4>
                    <div className="rounded p-3 font-mono text-sm" style={{ backgroundColor: 'var(--ctp-mantle)' }}>
                      <div style={{ color: 'var(--ctp-mauve)' }}>{t('settingsPanel.theme.comment')}</div>
                      <div style={{ color: 'var(--ctp-blue)' }}>{t('settingsPanel.theme.function')} <span style={{ color: 'var(--ctp-yellow)' }}>{t('settingsPanel.theme.functionName')}</span>():</div>
                      <div className="ml-4" style={{ color: 'var(--ctp-green)' }}>{t('settingsPanel.theme.string')}</div>
                      <div className="ml-4" style={{ color: 'var(--ctp-peach)' }}>{t('settingsPanel.theme.print')}</div>(<span style={{ color: 'var(--ctp-green)' }}>{t('settingsPanel.theme.welcome')}</span>)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'python' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ctp-text)' }}><i className="fab fa-python"></i> {t('settingsPanel.python.title')}</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.python.defaultVersion')}</label>
                    <select
                      value={settings.python.defaultVersion}
                      onChange={(e) => updatePythonSettings('defaultVersion', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      style={{
                        backgroundColor: 'var(--ctp-surface0)',
                        borderColor: 'var(--ctp-surface1)',
                        color: 'var(--ctp-text)'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--ctp-blue)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--ctp-surface1)'
                      }}
                    >
                      <option value="3.12">Python 3.12</option>
                      <option value="3.11">Python 3.11</option>
                      <option value="3.10">Python 3.10</option>
                      <option value="3.9">Python 3.9</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'autoCreateVenv', label: t('settingsPanel.python.autoCreateVenv') },
                    { key: 'useUV', label: t('settingsPanel.python.useUV') }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2" style={{ color: 'var(--ctp-text)' }}>
                      <input
                        type="checkbox"
                        checked={settings.python[key as keyof IDESettings['python']] as boolean}
                        onChange={(e) => updatePythonSettings(key as any, e.target.checked)}
                        className="rounded"
                        style={{
                          backgroundColor: 'var(--ctp-surface0)',
                          borderColor: 'var(--ctp-surface1)'
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ruff' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ctp-text)' }}><i className="fas fa-search"></i> {t('settingsPanel.ruff.title')}</h3>

                <div className="space-y-4">
                  {[
                    { key: 'enabled', label: t('settingsPanel.ruff.enabled') },
                    { key: 'formatOnSave', label: t('settingsPanel.ruff.formatOnSave') },
                    { key: 'lintOnSave', label: t('settingsPanel.ruff.lintOnSave') }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2" style={{ color: 'var(--ctp-text)' }}>
                      <input
                        type="checkbox"
                        checked={settings.ruff[key as keyof IDESettings['ruff']] as boolean}
                        onChange={(e) => updateRuffSettings(key as any, e.target.checked)}
                        className="rounded"
                        style={{
                          backgroundColor: 'var(--ctp-surface0)',
                          borderColor: 'var(--ctp-surface1)'
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.ruff.configPath')}</label>
                  <input
                    type="text"
                    value={settings.ruff.configPath}
                    onChange={(e) => updateRuffSettings('configPath', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    style={{
                      backgroundColor: 'var(--ctp-surface0)',
                      borderColor: 'var(--ctp-surface1)',
                      color: 'var(--ctp-text)'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ctp-blue)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ctp-surface1)'
                    }}
                    placeholder="pyproject.toml"
                  />
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ctp-text)' }}><i className="fas fa-cog"></i> {t('settingsPanel.general.title')}</h3>

                <div className="space-y-4">
                  {[
                    { key: 'autoSave', label: t('settingsPanel.general.autoSave') },
                    { key: 'confirmDelete', label: t('settingsPanel.general.confirmDelete') },
                    { key: 'showHiddenFiles', label: t('settingsPanel.general.showHiddenFiles') }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2" style={{ color: 'var(--ctp-text)' }}>
                      <input
                        type="checkbox"
                        checked={settings.general[key as keyof IDESettings['general']] as boolean}
                        onChange={(e) => updateGeneralSettings(key as any, e.target.checked)}
                        className="rounded"
                        style={{
                          backgroundColor: 'var(--ctp-surface0)',
                          borderColor: 'var(--ctp-surface1)'
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>{t('settingsPanel.general.autoSaveDelay')}</label>
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    step="500"
                    value={settings.general.autoSaveDelay}
                    onChange={(e) => updateGeneralSettings('autoSaveDelay', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded"
                    style={{
                      backgroundColor: 'var(--ctp-surface0)',
                      borderColor: 'var(--ctp-surface1)',
                      color: 'var(--ctp-text)'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ctp-blue)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ctp-surface1)'
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ctp-text)' }}><i className="fas fa-language"></i> {t('settingsPanel.language.title')}</h3>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ctp-subtext1)' }}>
                    {t('settingsPanel.language.selectLanguage')}
                  </label>
                  <select
                    value={i18n.language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    style={{
                      backgroundColor: 'var(--ctp-surface0)',
                      borderColor: 'var(--ctp-surface1)',
                      color: 'var(--ctp-text)'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ctp-blue)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ctp-surface1)'
                    }}
                  >
                    <option value="en">{t('settingsPanel.language.english')}</option>
                    <option value="zh-CN">{t('settingsPanel.language.chineseSimplified')}</option>
                  </select>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--ctp-surface0)' }}>
                  <div className="flex items-center gap-2" style={{ color: 'var(--ctp-subtext1)' }}>
                    <i className="fas fa-info-circle"></i>
                    <span className="text-sm">{t('settingsPanel.language.restartHint')}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg border-2" style={{
                  borderColor: 'var(--ctp-surface2)',
                  backgroundColor: 'var(--ctp-mantle)'
                }}>
                  <h4 className="text-md font-medium mb-3" style={{ color: 'var(--ctp-subtext1)' }}>
                    {i18n.language === 'zh-CN' ? '当前语言' : 'Current Language'}
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {i18n.language === 'zh-CN' ? '🇨🇳' : '🇬🇧'}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--ctp-text)' }}>
                        {i18n.language === 'zh-CN' ? '简体中文' : 'English'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--ctp-subtext1)' }}>
                        {i18n.language === 'zh-CN' ? 'Simplified Chinese' : 'English (US)'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel