/**
 * [INPUT]: 依赖 react, react-i18next, ../../lib/tauri 的 TauriAPI/RuffDiagnostic
 * [OUTPUT]: 对外提供 useRuffLinting hook (runLinting, formatFile, quickLint, debouncedLint)
 * [POS]: editor/ 的 Ruff 代码检查与格式化集成，管理编辑器标记 + 装饰
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useRef, useCallback, type MutableRefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { TauriAPI, type RuffDiagnostic } from '../../lib/tauri'
import type * as Monaco from 'monaco-editor'

/* ================================================================
 * Options
 * ================================================================ */

interface UseRuffLintingOptions {
  filePath: string | null
  projectPath: string
  editorRef: MutableRefObject<Monaco.editor.IStandaloneCodeEditor | null>
  monacoRef: MutableRefObject<any>
  onConsoleOutput?: (output: string) => void
  onConsoleError?: (error: string) => void
  onContentUpdate?: (content: string) => void
}

/* ================================================================
 * severity → style 映射 (纯函数，无副作用)
 * ================================================================ */

function getSeverityStyles(severity: string, m: any) {
  const s = severity.toLowerCase()

  if (s.includes('error') || s === 'e') {
    return {
      className: 'ruff-error-decoration',
      glyphMarginClassName: 'ruff-error-glyph',
      linesDecorationsClassName: 'ruff-error-line',
      overviewRulerColor: '#dc2626',
      minimapColor: '#dc2626',
      monacoSeverity: m?.MarkerSeverity?.Error ?? 8,
    }
  }

  if (s.includes('warn') || s === 'w') {
    return {
      className: 'ruff-warning-decoration',
      glyphMarginClassName: 'ruff-warning-glyph',
      linesDecorationsClassName: 'ruff-warning-line',
      overviewRulerColor: '#f59e0b',
      minimapColor: '#f59e0b',
      monacoSeverity: m?.MarkerSeverity?.Warning ?? 4,
    }
  }

  return {
    className: 'ruff-info-decoration',
    glyphMarginClassName: 'ruff-info-glyph',
    linesDecorationsClassName: 'ruff-info-line',
    overviewRulerColor: '#3b82f6',
    minimapColor: '#3b82f6',
    monacoSeverity: m?.MarkerSeverity?.Info ?? 2,
  }
}

/* ================================================================
 * Hook
 * ================================================================ */

export function useRuffLinting({
  filePath, projectPath,
  editorRef, monacoRef,
  onConsoleOutput, onConsoleError, onContentUpdate,
}: UseRuffLintingOptions) {
  const { t } = useTranslation()
  const decorationIdsRef = useRef<string[]>([])
  const quickTimerRef = useRef<number | null>(null)
  const fullTimerRef = useRef<number | null>(null)

  /* ---- 诊断结果 → 编辑器装饰 + 标记 ---- */
  const applyDiagnostics = useCallback((diagnostics: RuffDiagnostic[]) => {
    const m = monacoRef.current
    const editor = editorRef.current
    if (!editor || !m?.editor) return

    const model = editor.getModel()
    if (!model) return

    /* 清除旧装饰 */
    if (decorationIdsRef.current.length > 0) {
      editor.deltaDecorations(decorationIdsRef.current, [])
      decorationIdsRef.current = []
    }
    m.editor.setModelMarkers(model, 'ruff', [])

    if (diagnostics.length === 0) return

    /* 装饰 */
    const decorations = diagnostics.map(d => {
      const styles = getSeverityStyles(d.severity, m)
      return {
        range: new m.Range(
          Math.max(1, d.line), Math.max(1, d.column),
          Math.max(1, d.end_line), Math.max(1, d.end_column),
        ),
        options: {
          className: styles.className,
          hoverMessage: { value: `**${d.severity.toUpperCase()} - ${d.rule}**: ${d.message}` },
          glyphMarginClassName: styles.glyphMarginClassName,
          linesDecorationsClassName: styles.linesDecorationsClassName,
          overviewRuler: { color: styles.overviewRulerColor, position: m.OverviewRulerLane?.Right ?? 1 },
          minimap: { color: styles.minimapColor, position: m.MinimapPosition?.Inline ?? 1 },
          stickiness: m.TrackedRangeStickiness?.NeverGrowsWhenTypingAtEdges ?? 1,
        },
      }
    })
    decorationIdsRef.current = editor.deltaDecorations([], decorations)

    /* 标记 */
    const markers = diagnostics.map(d => {
      const styles = getSeverityStyles(d.severity, m)
      return {
        startLineNumber: Math.max(1, d.line),
        startColumn: Math.max(1, d.column),
        endLineNumber: Math.max(1, d.end_line),
        endColumn: Math.max(1, d.end_column),
        message: `${d.rule}: ${d.message}`,
        severity: styles.monacoSeverity,
        source: 'Ruff',
      }
    })
    m.editor.setModelMarkers(model, 'ruff', markers)

    editor.layout()

    /* 定位到首个重要诊断 */
    const first =
      diagnostics.find(d => { const sv = d.severity.toLowerCase(); return sv.includes('error') || sv === 'e' }) ??
      diagnostics.find(d => { const sv = d.severity.toLowerCase(); return sv.includes('warn') || sv === 'w' }) ??
      diagnostics[0]
    if (first) editor.revealLineInCenter(first.line)
  }, [editorRef, monacoRef])

  /* ---- 执行 Ruff 检查 ---- */
  const runLinting = useCallback(async (targetPath?: string) => {
    const path = targetPath ?? filePath
    if (!path?.endsWith('.py') || !projectPath) return

    try {
      const result = await TauriAPI.ruffCheckFile(projectPath, path)
      applyDiagnostics(result?.diagnostics ?? [])
    } catch {
      applyDiagnostics([])
    }
  }, [filePath, projectPath, applyDiagnostics])

  /* ---- 格式化 ---- */
  const formatFile = useCallback(async () => {
    if (!filePath?.endsWith('.py') || !projectPath) return

    onConsoleOutput?.(`${t('messages.ruffFormatting')}\n`)
    try {
      await TauriAPI.ruffFormatFile(projectPath, filePath)
      const content = await TauriAPI.readFile(filePath)
      onContentUpdate?.(content)

      if (editorRef.current) {
        editorRef.current.setValue(content)
        onConsoleOutput?.(`${t('messages.ruffFormatSuccess')}\n`)
      } else {
        onConsoleOutput?.(`${t('messages.ruffFormatWarning')}\n`)
      }
    } catch (error) {
      onConsoleError?.(`${t('messages.ruffFormatFailed', { error: String(error) })}\n`)
    }
  }, [filePath, projectPath, editorRef, onConsoleOutput, onConsoleError, onContentUpdate, t])

  /* ---- 快速检查 (300ms debounce) ---- */
  const quickLint = useCallback((path: string) => {
    if (!path.endsWith('.py') || !projectPath) return
    if (quickTimerRef.current) clearTimeout(quickTimerRef.current)
    quickTimerRef.current = window.setTimeout(() => runLinting(path), 300)
  }, [projectPath, runLinting])

  /* ---- 完整检查 (1000ms debounce) ---- */
  const debouncedLint = useCallback((path: string) => {
    if (fullTimerRef.current) clearTimeout(fullTimerRef.current)
    fullTimerRef.current = window.setTimeout(() => runLinting(path), 1000)
  }, [runLinting])

  return { runLinting, formatFile, quickLint, debouncedLint }
}
