/**
 * [INPUT]: 依赖 react, react-i18next, @tauri-apps/api/event, ../../lib/tauri
 * [OUTPUT]: 对外提供 useScriptRunner hook (isRunning, run, stop)
 * [POS]: editor/ 的脚本执行生命周期管理，监听 script-output/error/completed 事件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { listen } from '@tauri-apps/api/event'
import { TauriAPI } from '../../lib/tauri'

/* ================================================================
 * Options
 * ================================================================ */

interface UseScriptRunnerOptions {
  filePath: string | null
  projectPath: string
  onConsoleOutput?: (output: string) => void
  onConsoleError?: (error: string) => void
  onScriptStart?: () => void
  onScriptStop?: () => void
}

/* ================================================================
 * Hook
 * ================================================================ */

export function useScriptRunner({
  filePath, projectPath,
  onConsoleOutput, onConsoleError,
  onScriptStart, onScriptStop,
}: UseScriptRunnerOptions) {
  const { t } = useTranslation()
  const [isRunning, setIsRunning] = useState(false)

  /* ---- 事件监听: script-output / script-error / script-completed ---- */
  useEffect(() => {
    const unOutput = listen('script-output', (e) => onConsoleOutput?.(e.payload as string))
    const unError = listen('script-error', (e) => onConsoleError?.(e.payload as string))
    const unDone = listen('script-completed', () => {
      setIsRunning(false)
      onScriptStop?.()
    })

    return () => {
      unOutput.then(f => f())
      unError.then(f => f())
      unDone.then(f => f())
    }
  }, [onConsoleOutput, onConsoleError, onScriptStop])

  /* ---- run: 优先 UV → 回退 streaming ---- */
  const run = useCallback(async () => {
    if (!filePath || !projectPath || isRunning) return
    if (!filePath.endsWith('.py')) {
      onConsoleError?.(`${t('messages.pythonFileOnly')}\n`)
      return
    }

    setIsRunning(true)
    onConsoleOutput?.(`${t('messages.runningScript', { path: filePath })}\n`)
    onScriptStart?.()

    try {
      const hasPyproject = await TauriAPI.fileExists(`${projectPath}/pyproject.toml`)
      if (hasPyproject) {
        onConsoleOutput?.(`${t('messages.usingUvStreaming')}\n`)
        try {
          await TauriAPI.runScriptWithUvStreaming(projectPath, filePath)
          return
        } catch {
          onConsoleOutput?.(`${t('messages.uvFallback')}\n`)
        }
      }
      await TauriAPI.runScriptWithStreaming(projectPath, filePath)
    } catch (error) {
      onConsoleError?.(`${t('messages.scriptError', { error: String(error) })}\n`)
      setIsRunning(false)
      onScriptStop?.()
    }
  }, [filePath, projectPath, isRunning, onConsoleOutput, onConsoleError, onScriptStart, onScriptStop, t])

  /* ---- stop ---- */
  const stop = useCallback(() => {
    if (!isRunning) return
    TauriAPI.stopRunningScript()
      .finally(() => { setIsRunning(false); onScriptStop?.() })
  }, [isRunning, onScriptStop])

  return { isRunning, run, stop }
}
