/**
 * [INPUT]: 依赖 @tauri-apps/api/app 的 setTheme
 * [OUTPUT]: 对外提供 applyThemeToDocument
 * [POS]: themes/ 的主题应用器，CSS [data-theme] 负责变量切换，此函数只设 data-attr + native theme
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setTheme as setNativeTheme } from '@tauri-apps/api/app'

/* ================================================================
 * 主题应用 - 设置 data-theme 属性 + 原生窗口主题
 *
 * CSS 变量已在 index.css [data-theme] 中完整定义，
 * 不再需要 JS 逐个 setProperty。
 * ================================================================ */

export async function applyThemeToDocument(theme: string): Promise<void> {
  // 设置原生窗口主题（影响 macOS/Windows 标题栏）
  const nativeTheme = theme === 'catppuccin-latte' ? 'light' : 'dark'
  try {
    await setNativeTheme(nativeTheme)
  } catch {
    // Tauri API 可能在开发环境下不可用
  }

  if (theme.startsWith('catppuccin-')) {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
  } else {
    document.documentElement.removeAttribute('data-theme')
    document.body.removeAttribute('data-theme')
  }
}
