/**
 * [INPUT]: 依赖 react, ../types/settings, ../lib/storage, ../themes/theme-applicator
 * [OUTPUT]: 对外提供 SettingsProvider, useSettings hook
 * [POS]: contexts/ 的设置状态管理，唯一 settings 真相源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { type IDESettings, DEFAULT_SETTINGS } from '../types/settings'
import { StorageKeys, loadJSON, saveJSON } from '../lib/storage'
import { applyThemeToDocument } from '../themes/theme-applicator'

/* ================================================================
 * Context 接口
 * ================================================================ */

interface SettingsContextValue {
  settings: IDESettings
  updateSettings: (patch: Partial<IDESettings>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

/* ================================================================
 * Provider
 * ================================================================ */

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<IDESettings>(() => {
    const saved = loadJSON<IDESettings>(StorageKeys.SETTINGS)
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS
  })

  // 初始主题应用
  useEffect(() => {
    applyThemeToDocument(settings.theme.uiTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateSettings = useCallback((patch: Partial<IDESettings>) => {
    setSettings(prev => {
      const next: IDESettings = {
        ...prev,
        ...patch,
        editor: { ...prev.editor, ...(patch.editor ?? {}) },
        theme: { ...prev.theme, ...(patch.theme ?? {}) },
        python: { ...prev.python, ...(patch.python ?? {}) },
        ruff: { ...prev.ruff, ...(patch.ruff ?? {}) },
        general: { ...prev.general, ...(patch.general ?? {}) },
      }
      saveJSON(StorageKeys.SETTINGS, next)
      if (patch.theme?.uiTheme) {
        applyThemeToDocument(patch.theme.uiTheme)
      }
      return next
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    saveJSON(StorageKeys.SETTINGS, DEFAULT_SETTINGS)
    applyThemeToDocument(DEFAULT_SETTINGS.theme.uiTheme)
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

/* ================================================================
 * Consumer hook
 * ================================================================ */

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return ctx
}
