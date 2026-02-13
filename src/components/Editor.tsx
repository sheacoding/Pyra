/**
 * [INPUT]: 依赖 react, react-i18next, @monaco-editor/react, ../types/settings, ./Icon, editor/* hooks
 * [OUTPUT]: 对外提供 Editor 组件 (forwardRef), EditorHandle 接口
 * [POS]: components/ 的核心编辑器入口，组合 4 个 editor hooks
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Editor as MonacoEditor } from '@monaco-editor/react'
import { TauriAPI } from '../lib/tauri'
import type * as Monaco from 'monaco-editor'
import { IDESettings } from '../types/settings'
import { Icon } from './Icon'
import { useScriptRunner } from './editor/useScriptRunner'
import { useBreakpoints } from './editor/useBreakpoints'
import { useRuffLinting } from './editor/useRuffLinting'
import { useMonacoTheme } from './editor/useMonacoTheme'

/* ================================================================
 * Types
 * ================================================================ */

interface EditorProps {
  filePath: string | null
  projectPath: string
  settings?: IDESettings | null
  onConsoleOutput?: (output: string) => void
  onConsoleError?: (error: string) => void
  onScriptStart?: () => void
  onScriptStop?: () => void
}

export interface EditorHandle {
  run: () => void
  stop: () => void
  format: () => void
  lint: () => void
  getContent: () => string
  getBreakpoints: () => number[]
  revealLocation: (line: number, column?: number) => boolean
  refreshLayout: () => void
}

/* ================================================================
 * 语言检测
 * ================================================================ */

const EXT_LANGUAGE: Record<string, string> = {
  py: 'python', js: 'javascript', ts: 'typescript',
  json: 'json', md: 'markdown', markdown: 'markdown',
  toml: 'toml', html: 'html', css: 'css',
}

function getLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  return EXT_LANGUAGE[ext] ?? 'plaintext'
}

/* ================================================================
 * Editor Component
 * ================================================================ */

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { filePath, projectPath, settings, onConsoleOutput, onConsoleError, onScriptStart, onScriptStop },
  ref,
) {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<any>(null)

  /* ---- hooks 组合 ---- */
  const script = useScriptRunner({ filePath, projectPath, onConsoleOutput, onConsoleError, onScriptStart, onScriptStop })
  const bp = useBreakpoints({ editorRef, monacoRef, onConsoleOutput })
  const ruff = useRuffLinting({ filePath, projectPath, editorRef, monacoRef, onConsoleOutput, onConsoleError, onContentUpdate: setContent })
  const theme = useMonacoTheme({ settings, editorRef, monacoRef })

  /* ---- 文件加载 ---- */
  useEffect(() => {
    if (!filePath) return
    let cancelled = false

    setLoading(true)
    TauriAPI.readFile(filePath)
      .then(text => { if (!cancelled) setContent(text) })
      .catch(() => { if (!cancelled) setContent('') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [filePath])

  /* 初始 lint (仅 dev 模式) */
  useEffect(() => {
    if (!filePath?.endsWith('.py') || loading || !content) return
    if (!import.meta.env.DEV) return
    const timer = setTimeout(() => ruff.runLinting(filePath), 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath, loading])

  /* ---- 内容变更 → 保存 + lint ---- */
  const handleContentChange = useCallback(async (value: string | undefined) => {
    if (!value || !filePath) return
    setContent(value)

    try {
      await TauriAPI.writeFile(filePath, value)
      if (filePath.endsWith('.py')) {
        ruff.quickLint(filePath)
        if (settings?.ruff?.lintOnSave) ruff.debouncedLint(filePath)
      }
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }, [filePath, settings?.ruff?.lintOnSave, ruff])

  /* ---- 跳转到指定位置 ---- */
  const revealEditorLocation = useCallback((line: number, column = 1) => {
    const editor = editorRef.current
    if (!editor) return false

    const pos = { lineNumber: Math.max(1, line), column: Math.max(1, column) }
    editor.revealPositionInCenter(pos)
    editor.setSelection({
      startLineNumber: pos.lineNumber, startColumn: pos.column,
      endLineNumber: pos.lineNumber, endColumn: pos.column,
    })
    editor.focus()
    return true
  }, [])

  /* ---- 编辑器挂载 ---- */
  const handleEditorMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, m: any) => {
    editorRef.current = editor
    monacoRef.current = m || monacoRef.current

    theme.applyThemeOnMount(editor)
    editor.updateOptions({ readOnly: false, domReadOnly: false })

    /* 断点点击 */
    editor.onMouseDown((e) => {
      if (e.target.type === m.editor.MouseTargetType.GUTTER_GLYPH_MARGIN && e.target.position) {
        bp.toggle(e.target.position.lineNumber)
      }
    })

    /* Cmd+Shift+F → 格式化 */
    editor.addCommand(m.KeyMod.CtrlCmd | m.KeyMod.Shift | m.KeyCode.KeyF, () => {
      if (filePath?.endsWith('.py')) void ruff.formatFile()
    })

    /* Cmd+S → 保存 + 可选格式化 */
    editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, async () => {
      if (!filePath) return
      try {
        await TauriAPI.writeFile(filePath, editor.getValue())
        if (filePath.endsWith('.py') && settings?.ruff?.formatOnSave) {
          await ruff.formatFile()
        }
      } catch (error) {
        console.error('Failed to save file:', error)
      }
    })
  }, [filePath, settings?.ruff?.formatOnSave, theme, bp, ruff])

  /* ---- imperative handle (App.tsx 向后兼容) ---- */
  useImperativeHandle(ref, () => ({
    run: script.run,
    stop: script.stop,
    format: () => { void ruff.formatFile() },
    lint: () => { if (filePath) void ruff.runLinting(filePath) },
    getContent: () => editorRef.current?.getValue() ?? content,
    getBreakpoints: () => Array.from(bp.breakpoints),
    revealLocation: revealEditorLocation,
    refreshLayout: () => editorRef.current?.layout(),
  }), [script, ruff, bp.breakpoints, content, filePath, revealEditorLocation])

  /* ---- 空状态 ---- */
  if (!filePath) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--ctp-overlay0)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4"><Icon name="python" size={72} color="var(--ctp-blue)" /></div>
          <div className="text-xl mb-2" style={{ color: 'var(--ctp-text)' }}>Welcome to Pyra IDE</div>
          <div className="text-sm" style={{ color: 'var(--ctp-subtext1)' }}>Open a file to start editing</div>
        </div>
      </div>
    )
  }

  /* ---- 加载状态 ---- */
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--ctp-overlay0)' }}>
        {t('editor.loading')}
      </div>
    )
  }

  /* ---- Monaco Editor ---- */
  return (
    <div className="h-full flex flex-col">
      <div
        className="flex-1"
        style={{ backgroundColor: theme.themeColors.background, color: theme.themeColors.foreground }}
      >
        <MonacoEditor
          height="100%"
          language={getLanguage(filePath)}
          value={content}
          onChange={handleContentChange}
          beforeMount={theme.handleBeforeMount}
          onMount={handleEditorMount}
          theme={settings?.theme?.editorTheme || 'catppuccin-mocha'}
          options={{
            fontSize: settings?.editor?.fontSize ?? 14,
            fontFamily: settings?.editor?.fontFamily ?? 'JetBrains Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, monospace',
            minimap: { enabled: settings?.editor?.minimap ?? false },
            lineNumbers: settings?.editor?.lineNumbers !== false ? 'on' : 'off',
            folding: true,
            wordWrap: settings?.editor?.wordWrap ? 'on' : 'off',
            automaticLayout: true,
            tabSize: settings?.editor?.tabSize ?? 4,
            insertSpaces: settings?.editor?.insertSpaces ?? true,
            renderWhitespace: settings?.editor?.renderWhitespace ? 'all' : 'selection',
            scrollBeyondLastLine: false,
            readOnly: false,
            domReadOnly: false,
            lineNumbersMinChars: 3,
            glyphMargin: true,
            hover: { enabled: true, sticky: true },
            quickSuggestions: { other: true, comments: true, strings: true },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
            selectionHighlight: true,
            occurrencesHighlight: 'singleFile',
            renderLineHighlight: 'all',
            renderLineHighlightOnlyWhenFocus: false,
          }}
        />
      </div>
    </div>
  )
})
