import { useState, useEffect } from 'react'
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
    editorTheme: 'vs-dark' | 'vs-light' | 'hc-black' | 'catppuccin-mocha' | 'catppuccin-latte'
    uiTheme: 'dark' | 'light' | 'catppuccin-mocha' | 'catppuccin-latte'
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
  const [settings, setSettings] = useState<IDESettings>(defaultSettings)
  const [activeTab, setActiveTab] = useState<'editor' | 'theme' | 'python' | 'ruff' | 'general'>('editor')

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

  const resetToDefaults = () => {
    updateSettings(defaultSettings)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-4/5 max-w-4xl h-4/5 max-h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">⚙️ Pyra IDE Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            ✕
          </button>
        </div>

        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-1/4 bg-gray-900 p-4 border-r border-gray-700">
            <nav className="space-y-2">
              {[
                { key: 'editor', label: '📝 Editor', icon: '📝' },
                { key: 'theme', label: '🎨 Theme', icon: '🎨' },
                { key: 'python', label: '🐍 Python', icon: '🐍' },
                { key: 'ruff', label: '🔍 Ruff', icon: '🔍' },
                { key: 'general', label: '⚙️ General', icon: '⚙️' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    activeTab === key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="mt-8">
              <button
                onClick={resetToDefaults}
                className="w-full px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
              >
                🔄 Reset to Defaults
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'editor' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">📝 Editor Settings</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
                    <input
                      type="number"
                      min="10"
                      max="24"
                      value={settings.editor.fontSize}
                      onChange={(e) => updateEditorSettings('fontSize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tab Size</label>
                    <select
                      value={settings.editor.tabSize}
                      onChange={(e) => updateEditorSettings('tabSize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value={2}>2 spaces</option>
                      <option value={4}>4 spaces</option>
                      <option value={8}>8 spaces</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Font Family</label>
                    <input
                      type="text"
                      value={settings.editor.fontFamily}
                      onChange={(e) => updateEditorSettings('fontFamily', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'lineNumbers', label: 'Show Line Numbers' },
                    { key: 'wordWrap', label: 'Word Wrap' },
                    { key: 'minimap', label: 'Show Minimap' },
                    { key: 'renderWhitespace', label: 'Show Whitespace' },
                    { key: 'insertSpaces', label: 'Insert Spaces (not tabs)' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={settings.editor[key as keyof IDESettings['editor']] as boolean}
                        onChange={(e) => updateEditorSettings(key as any, e.target.checked)}
                        className="rounded bg-gray-700 border-gray-600"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">🎨 Theme Settings</h3>
                
                <div className="space-y-6">
                  {/* Catppuccin Theme Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Catppuccin Flavor</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          settings.theme.catppuccinFlavor === 'mocha' 
                            ? 'border-purple-500 bg-purple-900/20' 
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => {
                          updateThemeSettings('catppuccinFlavor', 'mocha')
                          updateThemeSettings('editorTheme', 'catppuccin-mocha')
                          updateThemeSettings('uiTheme', 'catppuccin-mocha')
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700"></div>
                          <div>
                            <div className="text-white font-medium">Mocha</div>
                            <div className="text-gray-400 text-xs">Dark & cozy</div>
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
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          settings.theme.catppuccinFlavor === 'latte' 
                            ? 'border-purple-500 bg-purple-900/20' 
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => {
                          updateThemeSettings('catppuccinFlavor', 'latte')
                          updateThemeSettings('editorTheme', 'catppuccin-latte')
                          updateThemeSettings('uiTheme', 'catppuccin-latte')
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-300 to-purple-500"></div>
                          <div>
                            <div className="text-white font-medium">Latte</div>
                            <div className="text-gray-400 text-xs">Light & warm</div>
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

                  {/* Legacy Theme Options */}
                  <div className="border-t border-gray-700 pt-6">
                    <h4 className="text-md font-medium text-gray-300 mb-4">Advanced Theme Options</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Editor Theme</label>
                        <select
                          value={settings.theme.editorTheme}
                          onChange={(e) => updateThemeSettings('editorTheme', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        >
                          <option value="catppuccin-mocha">Catppuccin Mocha</option>
                          <option value="catppuccin-latte">Catppuccin Latte</option>
                          <option value="vs-dark">VS Dark</option>
                          <option value="vs-light">VS Light</option>
                          <option value="hc-black">High Contrast</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">UI Theme</label>
                        <select
                          value={settings.theme.uiTheme}
                          onChange={(e) => updateThemeSettings('uiTheme', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        >
                          <option value="catppuccin-mocha">Catppuccin Mocha</option>
                          <option value="catppuccin-latte">Catppuccin Latte</option>
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Theme Preview */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-300 mb-3">Theme Preview</h4>
                    <div className="bg-gray-900 rounded p-3 font-mono text-sm">
                      <div className="text-purple-400"># This is a comment</div>
                      <div className="text-blue-400">def <span className="text-yellow-400">hello_world</span>():</div>
                      <div className="ml-4 text-green-400">"Hello, World!"</div>
                      <div className="ml-4 text-orange-400">print</div>(<span className="text-green-400">"Welcome to Pyra IDE"</span>)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'python' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">🐍 Python Settings</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Default Python Version</label>
                    <select
                      value={settings.python.defaultVersion}
                      onChange={(e) => updatePythonSettings('defaultVersion', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
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
                    { key: 'autoCreateVenv', label: 'Auto-create virtual environment' },
                    { key: 'useUV', label: 'Use UV for package management' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={settings.python[key as keyof IDESettings['python']] as boolean}
                        onChange={(e) => updatePythonSettings(key as any, e.target.checked)}
                        className="rounded bg-gray-700 border-gray-600"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ruff' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">🔍 Ruff Settings</h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'enabled', label: 'Enable Ruff linting' },
                    { key: 'formatOnSave', label: 'Format on save' },
                    { key: 'lintOnSave', label: 'Lint on save' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={settings.ruff[key as keyof IDESettings['ruff']] as boolean}
                        onChange={(e) => updateRuffSettings(key as any, e.target.checked)}
                        className="rounded bg-gray-700 border-gray-600"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Config File Path</label>
                  <input
                    type="text"
                    value={settings.ruff.configPath}
                    onChange={(e) => updateRuffSettings('configPath', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="pyproject.toml"
                  />
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">⚙️ General Settings</h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'autoSave', label: 'Auto-save files' },
                    { key: 'confirmDelete', label: 'Confirm before deleting files' },
                    { key: 'showHiddenFiles', label: 'Show hidden files in explorer' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={settings.general[key as keyof IDESettings['general']] as boolean}
                        onChange={(e) => updateGeneralSettings(key as any, e.target.checked)}
                        className="rounded bg-gray-700 border-gray-600"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Auto-save Delay (ms)</label>
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    step="500"
                    value={settings.general.autoSaveDelay}
                    onChange={(e) => updateGeneralSettings('autoSaveDelay', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
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