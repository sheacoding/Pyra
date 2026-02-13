/**
 * [INPUT]: 依赖 react, react-i18next, monaco-editor 类型
 * [OUTPUT]: 对外提供 useBreakpoints hook (breakpoints, toggle, updateDecorations)
 * [POS]: editor/ 的断点状态管理 + 编辑器 glyph margin 装饰渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useCallback, useRef, type MutableRefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type * as Monaco from 'monaco-editor'

/* ================================================================
 * Options
 * ================================================================ */

interface UseBreakpointsOptions {
  editorRef: MutableRefObject<Monaco.editor.IStandaloneCodeEditor | null>
  monacoRef: MutableRefObject<any>
  onConsoleOutput?: (output: string) => void
}

/* ================================================================
 * Hook
 * ================================================================ */

export function useBreakpoints({ editorRef, monacoRef, onConsoleOutput }: UseBreakpointsOptions) {
  const { t } = useTranslation()
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set())
  const [lastChange, setLastChange] = useState<{ line: number; added: boolean } | null>(null)
  const decorationsRef = useRef<string[]>([])

  /* ---- 副作用: 断点变更 → 控制台输出 ---- */
  useEffect(() => {
    if (!lastChange) return
    const key = lastChange.added ? 'messages.breakpointAdded' : 'messages.breakpointRemoved'
    onConsoleOutput?.(t(key, { line: lastChange.line }) + '\n')
    setLastChange(null)
  }, [lastChange, onConsoleOutput, t])

  /* ---- glyph margin 装饰同步 ---- */
  const updateDecorations = useCallback(() => {
    const editor = editorRef.current
    const m = monacoRef.current
    if (!editor || !m) return

    const newDecorations = Array.from(breakpoints).map(line => ({
      range: new m.Range(line, 1, line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'breakpoint-glyph',
        glyphMarginHoverMessage: { value: t('editor.breakpoint.toggle') },
      },
    }))

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations)
  }, [breakpoints, editorRef, monacoRef, t])

  /* 断点集合变化 → 重绘装��� */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { updateDecorations() }, [breakpoints])

  /* ---- toggle ---- */
  const toggle = useCallback((lineNumber: number) => {
    setBreakpoints(prev => {
      const next = new Set(prev)
      const existed = next.has(lineNumber)
      if (existed) { next.delete(lineNumber) } else { next.add(lineNumber) }
      setLastChange({ line: lineNumber, added: !existed })
      return next
    })
  }, [])

  return { breakpoints, toggle, updateDecorations }
}
