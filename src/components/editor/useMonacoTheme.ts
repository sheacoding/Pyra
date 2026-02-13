/**
 * [INPUT]: 依赖 react, ../../themes/monaco-catppuccin-fixed, ../../lib/monacoToml, ../../types/settings
 * [OUTPUT]: 对外提供 useMonacoTheme hook (handleBeforeMount, applyThemeOnMount, themeColors)
 * [POS]: editor/ 的 Monaco 主题注册 (Catppuccin mocha/latte) + 语言注册 (TOML/Markdown) + 主题切换
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useCallback, type MutableRefObject } from 'react'
import type * as Monaco from 'monaco-editor'
import { createMonacoCatppuccinTheme } from '../../themes/monaco-catppuccin-fixed'
import { tomlConf, tomlLanguage } from '../../lib/monacoToml'
import { conf as markdownConf, language as markdownLanguage } from 'monaco-editor/esm/vs/basic-languages/markdown/markdown'
import type { IDESettings } from '../../types/settings'

/* ================================================================
 * 主题 ↔ 颜色映射
 * ================================================================ */

const THEME_COLORS: Record<string, { background: string; foreground: string }> = {
  'catppuccin-mocha': { background: '#1e1e2e', foreground: '#cdd6f4' },
  'catppuccin-latte': { background: '#eff1f5', foreground: '#4c4f69' },
}
const DEFAULT_COLORS = THEME_COLORS['catppuccin-mocha']

/* ================================================================
 * Options
 * ================================================================ */

interface UseMonacoThemeOptions {
  settings?: IDESettings | null
  editorRef: MutableRefObject<Monaco.editor.IStandaloneCodeEditor | null>
  monacoRef: MutableRefObject<any>
}

/* ================================================================
 * Hook
 * ================================================================ */

export function useMonacoTheme({ settings, editorRef, monacoRef }: UseMonacoThemeOptions) {
  const editorTheme = settings?.theme?.editorTheme || 'catppuccin-mocha'
  const uiTheme = settings?.theme?.uiTheme || 'catppuccin-mocha'
  const themeColors = THEME_COLORS[editorTheme] ?? DEFAULT_COLORS

  /* ---- Monaco 挂载前: 注册主题 + 语言 ---- */
  const handleBeforeMount = useCallback((m: any) => {
    try {
      m.editor.defineTheme('catppuccin-mocha', createMonacoCatppuccinTheme('mocha'))
      m.editor.defineTheme('catppuccin-latte', createMonacoCatppuccinTheme('latte'))
      monacoRef.current = m

      const ensureLanguage = (
        id: string, config: any, langDef: any,
        opts?: { extensions?: string[]; aliases?: string[] },
      ) => {
        if (!m.languages.getLanguages().some((l: any) => l.id === id)) {
          m.languages.register({ id, ...(opts ?? {}) })
        }
        m.languages.setLanguageConfiguration(id, config)
        m.languages.setMonarchTokensProvider(id, langDef)
      }

      ensureLanguage('toml', tomlConf, tomlLanguage, { extensions: ['.toml'], aliases: ['TOML', 'toml'] })
      ensureLanguage('markdown', markdownConf, markdownLanguage, { extensions: ['.md', '.markdown'], aliases: ['Markdown', 'markdown', 'MD'] })
    } catch (error) {
      console.error('Failed to define themes before mount:', error)
    }
  }, [monacoRef])

  /* ---- 编辑器挂载后: 应用当前主题 ---- */
  const applyThemeOnMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor) => {
    try {
      monacoRef.current?.editor?.setTheme(editorTheme)
      setTimeout(() => {
        (monacoRef.current?.editor as any)?._themeService?.setTheme(editorTheme)
      }, 100)
    } catch { /* ignore */ }

    applyContainerBackground(editor, uiTheme)
  }, [editorTheme, uiTheme, monacoRef])

  /* ---- settings 变化 → 重新应用主题 ---- */
  useEffect(() => {
    const editor = editorRef.current
    const m = monacoRef.current
    if (!editor || !m?.editor) return

    try {
      m.editor.defineTheme('catppuccin-mocha', createMonacoCatppuccinTheme('mocha'))
      m.editor.defineTheme('catppuccin-latte', createMonacoCatppuccinTheme('latte'))
      m.editor.setTheme(editorTheme)

      /* 强制 re-tokenization 以确保主题生效 */
      const value = editor.getValue()
      editor.setValue('')
      setTimeout(() => editor.setValue(value), 10)
    } catch (error) {
      console.error('Failed to apply theme:', error)
    }

    applyContainerBackground(editor, uiTheme)
  }, [editorTheme, uiTheme, editorRef, monacoRef])

  return { handleBeforeMount, applyThemeOnMount, themeColors }
}

/* ================================================================
 * Helper: 强制容器背景色匹配主题
 * ================================================================ */

function applyContainerBackground(editor: Monaco.editor.IStandaloneCodeEditor, uiTheme: string) {
  const container = editor.getContainerDomNode()
  if (!container) return

  const bg = uiTheme === 'catppuccin-latte' ? '#eff1f5' : '#1e1e2e'
  container.style.backgroundColor = bg

  const monacoDiv = container.querySelector('.monaco-editor')
  if (monacoDiv instanceof HTMLElement) monacoDiv.style.backgroundColor = bg
}
