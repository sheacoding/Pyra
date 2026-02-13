/**
 * [INPUT]: 依赖 ../themes/catppuccin 的 CatppuccinFlavor 类型
 * [OUTPUT]: 对外提供 IDESettings 接口、DEFAULT_SETTINGS 常量
 * [POS]: types/ 的设置类型定义，被 SettingsContext 和 SettingsPanel 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { CatppuccinFlavor } from '../themes/catppuccin'

/* ================================================================
 * IDE 设置 - 唯一类型定义
 * ================================================================ */

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

/* ================================================================
 * 默认设置 - 唯一真相源
 * ================================================================ */

export const DEFAULT_SETTINGS: IDESettings = {
  editor: {
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, monospace',
    lineNumbers: true,
    wordWrap: true,
    minimap: false,
    renderWhitespace: false,
    tabSize: 4,
    insertSpaces: true,
  },
  theme: {
    editorTheme: 'catppuccin-mocha',
    uiTheme: 'catppuccin-mocha',
    catppuccinFlavor: 'mocha',
  },
  python: {
    defaultVersion: '3.11',
    autoCreateVenv: true,
    useUV: true,
  },
  ruff: {
    enabled: true,
    formatOnSave: false,
    lintOnSave: true,
    configPath: 'pyproject.toml',
  },
  general: {
    autoSave: true,
    autoSaveDelay: 2000,
    confirmDelete: true,
    showHiddenFiles: false,
  },
}
