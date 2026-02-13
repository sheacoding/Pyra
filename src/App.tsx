/**
 * [INPUT]: 依赖 react, react-i18next, @tauri-apps/api/event, 全部 components/*, lib/*, types/*, hooks/*
 * [OUTPUT]: 对外提供 App 根组件
 * [POS]: src/ 的应用入口，组合布局 + 状态协调
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { FileTree } from './components/FileTree'
import type { FileTreeHandle } from './components/FileTree'
import { Editor } from './components/Editor'
import type { EditorHandle } from './components/Editor'
import { Console } from './components/Console'
import { StatusBar } from './components/StatusBar'
import { ProjectPanel } from './components/ProjectPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { ProjectTemplateDialog } from './components/ProjectTemplateDialog'
import { TabsBar } from './components/TabsBar'
import { DebugPanel } from './components/DebugPanel'
import { Toolbar } from './components/layout/Toolbar'
import { VenvDialog } from './components/dialogs/VenvDialog'
import { TauriAPI, type Breakpoint } from './lib/tauri'
import { type IDESettings, DEFAULT_SETTINGS } from './types/settings'
import type { DebugBreakpointEventPayload, DebugOutputMessage } from './types/debug'
import { DEBUG_OUTPUT_LIMIT } from './lib/constants'
import { StorageKeys, loadJSON, saveJSON, loadString, saveString, removeKey } from './lib/storage'
import { applyThemeToDocument } from './themes/theme-applicator'
import { useWindowInit } from './hooks/useWindowInit'
import { useClickOutside } from './hooks/useClickOutside'

/* ================================================================
 * App
 * ================================================================ */

function App() {
  const { t } = useTranslation()

  /* ---- 核心状态 ---- */
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [projectPath, setProjectPath] = useState<string>('')
  const [consoleMessages, setConsoleMessages] = useState<Array<{id: string, content: string, type: 'stdout' | 'stderr' | 'error' | 'info', timestamp: Date}>>([])
  const [showProjectPanel, setShowProjectPanel] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [ideSettings, setIdeSettings] = useState<IDESettings | null>(null)
  const [showVenvDialog, setShowVenvDialog] = useState(false)
  const [, setVenvExists] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [uvReady, setUvReady] = useState(false)
  const [uvInstalling, setUvInstalling] = useState(false)
  const [showDebugMenu, setShowDebugMenu] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugBreakpoints, setDebugBreakpoints] = useState<Breakpoint[]>([])
  const [debugOutputMessages, setDebugOutputMessages] = useState<DebugOutputMessage[]>([])
  const [pendingDebugLocation, setPendingDebugLocation] = useState<{ file: string; line: number } | null>(null)

  /* ---- Refs ---- */
  const editorRef = useRef<EditorHandle | null>(null)
  const fileTreeRef = useRef<FileTreeHandle | null>(null)
  const debugMenuRef = useClickOutside<HTMLDivElement>(() => setShowDebugMenu(false), showDebugMenu)
  const debugStopRequestedRef = useRef(false)

  /* ---- 窗口初始化 ---- */
  useWindowInit()

  /* ---- 持久化: 项目路径 ---- */
  useEffect(() => {
    const storedPath = loadString(StorageKeys.LAST_PROJECT)
    if (storedPath) setProjectPath(storedPath)
  }, [])

  useEffect(() => {
    if (projectPath) { saveString(StorageKeys.LAST_PROJECT, projectPath) }
    else { removeKey(StorageKeys.LAST_PROJECT) }
  }, [projectPath])

  /* ---- 持久化: 设置 ---- */
  useEffect(() => {
    const saved = loadJSON<IDESettings>(StorageKeys.SETTINGS)
    const settings = saved ?? DEFAULT_SETTINGS
    if (!saved) saveJSON(StorageKeys.SETTINGS, DEFAULT_SETTINGS)
    setIdeSettings(settings)
    if (settings.theme?.uiTheme) applyThemeToDocument(settings.theme.uiTheme)
  }, [])

  /* ---- UV + Venv 检查 ---- */
  useEffect(() => {
    (async () => {
      try {
        const hasUv = await TauriAPI.checkUvInstalled()
        if (!hasUv) {
          setUvInstalling(true)
          try { await TauriAPI.ensureUvInstalled(); setUvReady(true) }
          catch { setUvReady(false) }
          finally { setUvInstalling(false) }
        } else {
          setUvReady(true)
        }
      } catch (e) {
        console.error('UV ensure step failed:', e)
      }
    })()

    if (!projectPath) return
    ;(async () => {
      try {
        const exists = await TauriAPI.checkVenvExists(projectPath)
        setVenvExists(exists)
        if (!exists) setTimeout(() => setShowVenvDialog(true), 1500)
      } catch (error) {
        console.error('Failed to check venv:', error)
      }
    })()
  }, [projectPath])

  /* ---- 浏览器快捷键禁用 (桌面应用体验) ---- */
  useEffect(() => {
    const prevent = (e: Event) => { e.preventDefault(); return false }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') return prevent(e)
      if (e.ctrlKey && e.shiftKey && 'IJC'.includes(e.key)) return prevent(e)
      if (e.ctrlKey && e.key === 'U') return prevent(e)
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) return prevent(e)
      if (e.ctrlKey && e.shiftKey && e.key === 'R') return prevent(e)
    }
    document.addEventListener('contextmenu', prevent)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  /* ---- 面板 resize 触发 editor layout ---- */
  useEffect(() => { editorRef.current?.refreshLayout?.() }, [showDebugPanel, showProjectPanel])

  /* ---- 控制台 ---- */
  const handleConsoleOutput = useCallback((output: string) => {
    setConsoleMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      content: output.replace(/\n$/, ''),
      type: 'stdout' as const,
      timestamp: new Date(),
    }])
  }, [])

  const handleConsoleError = useCallback((error: string) => {
    setConsoleMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      content: error.replace(/\n$/, ''),
      type: 'error' as const,
      timestamp: new Date(),
    }])
  }, [])

  /* ---- 调试输出 ---- */
  const appendDebugOutput = useCallback((category: string, content: string) => {
    setDebugOutputMessages(prev => {
      const entry: DebugOutputMessage = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        category,
        content,
      }
      const next = [...prev, entry]
      return next.length > DEBUG_OUTPUT_LIMIT ? next.slice(next.length - DEBUG_OUTPUT_LIMIT) : next
    })
  }, [])

  /* ---- 调试事件监听 ---- */
  useEffect(() => {
    let unStopped: UnlistenFn | undefined
    let unContinued: UnlistenFn | undefined
    let unTerminated: UnlistenFn | undefined
    let unOutput: UnlistenFn | undefined
    let unBreakpoint: UnlistenFn | undefined

    const setup = async () => {
      try {
        unStopped = await listen<{ reason?: string; threadId?: number }>('debug-stopped', () => {
          debugStopRequestedRef.current = false
          setIsDebugging(true)
          setShowDebugPanel(true)
        })

        unContinued = await listen('debug-continued', () => setIsDebugging(true))

        unTerminated = await listen('debug-terminated', () => {
          setIsDebugging(false)
          setShowDebugPanel(false)
          setDebugBreakpoints([])
          setPendingDebugLocation(null)
          if (debugStopRequestedRef.current) {
            debugStopRequestedRef.current = false
          } else {
            const msg = t('messages.debugStopped')
            handleConsoleOutput(msg + '\n')
            appendDebugOutput('info', msg)
          }
        })

        unOutput = await listen<{ category?: string; output?: string }>('debug-output', (event) => {
          const { category, output } = event.payload ?? {}
          if (!output) return
          const normalized = output.replace(/\r?\n$/, '')
          if (category === 'stderr') { handleConsoleError(normalized) }
          else { handleConsoleOutput(normalized) }
          appendDebugOutput(category ?? 'stdout', normalized)
        })

        unBreakpoint = await listen<DebugBreakpointEventPayload>('debug-breakpoint', (event) => {
          const bp = event.payload?.breakpoint
          if (!bp) return

          const file = bp.source?.path
          const line = typeof bp.line === 'number' ? bp.line : undefined
          const id = typeof bp.id === 'number' ? bp.id : undefined
          const verified = bp.verified ?? false
          const reason = event.payload?.reason

          if (reason === 'removed' && (file || id !== undefined)) {
            setDebugBreakpoints(prev => prev.filter(b => {
              if (id !== undefined && b.id !== undefined) return b.id !== id
              if (file && line !== undefined) return !(b.file === file && b.line === line)
              return true
            }))
            return
          }

          if (!file || line === undefined) return

          setDebugBreakpoints(prev => {
            const idx = prev.findIndex(b => {
              if (id !== undefined && b.id !== undefined) return b.id === id
              return b.file === file && b.line === line
            })
            if (idx === -1) return [...prev, { file, line, verified, id }]
            const next = [...prev]
            next[idx] = { ...next[idx], file, line, verified, id: id ?? next[idx].id }
            return next
          })
        })
      } catch (error) {
        console.error('Failed to set up debug listeners:', error)
      }
    }

    setup()
    return () => { unStopped?.(); unContinued?.(); unTerminated?.(); unOutput?.(); unBreakpoint?.() }
  }, [appendDebugOutput, handleConsoleError, handleConsoleOutput, t])

  /* ---- 调试: 定位到断点 ---- */
  useEffect(() => {
    if (!pendingDebugLocation) return
    const target = pendingDebugLocation
    let frameId = 0
    let cancelled = false

    const attemptReveal = () => {
      if (cancelled) return
      if (currentFile !== target.file) { frameId = requestAnimationFrame(attemptReveal); return }
      if (editorRef.current?.revealLocation(target.line)) { setPendingDebugLocation(null); return }
      frameId = requestAnimationFrame(attemptReveal)
    }

    frameId = requestAnimationFrame(attemptReveal)
    return () => { cancelled = true; cancelAnimationFrame(frameId) }
  }, [currentFile, pendingDebugLocation])

  /* ---- Tab 管理 ---- */
  const openFileInTab = useCallback((path: string) => {
    setOpenTabs(prev => (prev.includes(path) ? prev : [...prev, path]))
    setCurrentFile(path)
  }, [])

  const closeTab = (path: string) => {
    setOpenTabs(prev => prev.filter(p => p !== path))
    if (currentFile === path) {
      setCurrentFile(() => {
        const idx = openTabs.indexOf(path)
        const remaining = openTabs.filter(p => p !== path)
        if (remaining.length === 0) return null
        return remaining[Math.max(0, Math.min(idx - 1, remaining.length - 1))]
      })
    }
  }

  /* ---- 导航 ---- */
  const handleNavigateToLocation = useCallback((file: string, line: number) => {
    if (!file) return
    openFileInTab(file)
    setShowDebugPanel(true)
    setPendingDebugLocation({ file, line })
  }, [openFileInTab])

  /* ---- Toolbar 操作 ---- */
  const workspaceReady = Boolean(projectPath)

  const explorerNewFile = () => { if (!projectPath) { handleConsoleError(t('messages.noProjectOpen')); return }; fileTreeRef.current?.openNewFileDialog() }
  const explorerNewFolder = () => { if (!projectPath) { handleConsoleError(t('messages.noProjectOpen')); return }; fileTreeRef.current?.openNewFolderDialog() }
  const explorerRefresh = () => { if (!projectPath) { handleConsoleError(t('messages.noProjectOpen')); return }; fileTreeRef.current?.refresh() }

  const handleOpenFile = async () => {
    try {
      const filePath = await TauriAPI.openFileDialog()
      if (!filePath) return
      setCurrentFile(filePath)
      if (!openTabs.includes(filePath)) setOpenTabs(prev => [...prev, filePath])
      handleConsoleOutput(t('messages.fileOpened', { path: filePath }))
    } catch (error) {
      handleConsoleError(t('messages.openFileFailed', { error: String(error) }))
    }
  }

  const handleSaveFile = async () => {
    if (!currentFile) return
    try {
      const content = editorRef.current?.getContent() || ''
      await TauriAPI.writeFile(currentFile, content)
      handleConsoleOutput(t('messages.fileSaved', { path: currentFile }))
    } catch (error) {
      handleConsoleError(t('messages.saveFileFailed', { error: String(error) }))
    }
  }

  const editorRun = () => { if (!projectPath) { handleConsoleError(t('messages.noProjectOpen')); return }; editorRef.current?.run() }
  const editorFormat = () => { if (!projectPath) { handleConsoleError(t('messages.noProjectOpen')); return }; editorRef.current?.format() }
  const editorLint = () => { if (!projectPath) { handleConsoleError(t('messages.noProjectOpen')); return }; editorRef.current?.lint() }

  const editorStop = () => {
    if (isDebugging) { void handleStopDebugging() }
    else { editorRef.current?.stop() }
  }

  const handleStopDebugging = async () => {
    debugStopRequestedRef.current = true
    try {
      await TauriAPI.stopDebugSession()
      setIsDebugging(false); setShowDebugPanel(false); setDebugBreakpoints([]); setPendingDebugLocation(null)
      const msg = t('messages.debugStopped')
      handleConsoleOutput(msg + '\n')
      appendDebugOutput('info', msg)
    } catch (error) {
      debugStopRequestedRef.current = false
      console.error('Failed to stop debugging:', error)
      appendDebugOutput('stderr', t('messages.debugError', { error: String(error) }))
    }
  }

  const handleDebugMode = async (_mode: 'debug' | 'step' | 'visual') => {
    setShowDebugMenu(false)
    debugStopRequestedRef.current = false

    if (!currentFile?.endsWith('.py')) { handleConsoleError(t('messages.pythonFileOnly')); return }
    if (!projectPath) { handleConsoleError(t('messages.noProjectOpen')); return }
    if (isDebugging) { setShowDebugPanel(prev => !prev); return }

    try {
      setDebugOutputMessages([]); setShowDebugPanel(true); setIsDebugging(true)
      const starting = t('messages.debugStarting')
      handleConsoleOutput(starting + '\n')
      appendDebugOutput('info', starting)

      const breakpoints = editorRef.current?.getBreakpoints?.() || []
      if (breakpoints.length === 0) {
        const warn = t('messages.noBreakpoints')
        handleConsoleOutput(warn + '\n')
        appendDebugOutput('info', warn)
      }

      const apiBreakpoints = breakpoints.map(line => ({ file: currentFile!, line, verified: false }))
      setDebugBreakpoints(apiBreakpoints)

      await TauriAPI.startDebugSession(projectPath, currentFile!, apiBreakpoints)

      setIsDebugging(true); setShowDebugPanel(true)
      const started = t('messages.debugStarted')
      handleConsoleOutput(started + '\n')
      appendDebugOutput('info', started)
    } catch (error) {
      handleConsoleError(t('messages.debugError', { error: String(error) }) + '\n')
      console.error('Debug error:', error)
      appendDebugOutput('stderr', t('messages.debugError', { error: String(error) }))
      setIsDebugging(false); setShowDebugPanel(false); setDebugBreakpoints([]); setDebugOutputMessages([])
    }
  }

  /* ---- 项目 / 设置 / Venv 操作 ---- */
  const handleOpenProject = async () => {
    try {
      const selectedPath = await TauriAPI.openProjectDialog()
      if (!selectedPath) return
      setProjectPath(selectedPath)
      setCurrentFile(null)
      const name = selectedPath.split(/[/\\]/).pop()
      handleConsoleOutput(t('messages.projectOpened', { name }))
      handleConsoleOutput(t('messages.projectLocation', { path: selectedPath }))
    } catch (error) {
      handleConsoleError(t('messages.openProjectFailed', { error: String(error) }))
    }
  }

  const handleCreateProject = (name: string, path: string) => {
    handleConsoleOutput(t('messages.projectCreated', { name }))
    handleConsoleOutput(t('messages.projectLocation', { path }))
    setProjectPath(path)
    setCurrentFile(null)
    handleConsoleOutput(t('messages.projectSwitched', { name }))
  }

  const handleSettingsChange = (settings: IDESettings) => {
    setIdeSettings(settings)
    if (settings.theme?.uiTheme) applyThemeToDocument(settings.theme.uiTheme)
  }

  const handleCreateVenv = async (pythonVersion: string = '3.11') => {
    if (!projectPath) { handleConsoleError(t('messages.noProjectOpen')); return }
    try {
      handleConsoleOutput(t('messages.venvCreating', { version: pythonVersion }))
      const result = await TauriAPI.createVenv(projectPath, pythonVersion)
      handleConsoleOutput(t('messages.venvCreated'))
      handleConsoleOutput(result)
      setVenvExists(true)
      setShowVenvDialog(false)
    } catch (error) {
      handleConsoleError(t('messages.venvCreateFailed', { error: String(error) }))
    }
  }

  const handleToggleProjectPanel = (e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation()
    setShowProjectPanel(prev => !prev)
  }

  /* ---- Render ---- */
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--ctp-base)' }}>
      {/* Toolbar */}
      <Toolbar
        workspaceReady={workspaceReady}
        currentFile={currentFile}
        uvReady={uvReady}
        uvInstalling={uvInstalling}
        isDebugging={isDebugging}
        showProjectPanel={showProjectPanel}
        showDebugMenu={showDebugMenu}
        debugMenuRef={debugMenuRef}
        onNewProject={() => setShowTemplateDialog(true)}
        onOpenProject={handleOpenProject}
        onNewFile={explorerNewFile}
        onNewFolder={explorerNewFolder}
        onRefresh={explorerRefresh}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onRun={editorRun}
        onStop={editorStop}
        onFormat={editorFormat}
        onLint={editorLint}
        onToggleDebugMenu={() => setShowDebugMenu(prev => !prev)}
        onDebugMode={handleDebugMode}
        onToggleProjectPanel={handleToggleProjectPanel}
        onOpenSettings={() => setShowSettingsPanel(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-48 sm:w-56 md:w-64 border-r flex-shrink-0" style={{ backgroundColor: 'var(--ctp-mantle)', borderColor: 'var(--ctp-surface1)' }}>
          {workspaceReady ? (
            <FileTree ref={fileTreeRef} projectPath={projectPath} onFileSelect={openFileInTab} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 px-4 text-center" style={{ color: 'var(--ctp-subtext1)' }}>
              <p className="text-sm">{t('fileTree.noProject')}</p>
              <button onClick={handleOpenProject} className="w-full px-3 py-2 text-sm rounded font-medium transition-colors btn-ctp-blue">
                {t('fileTree.openProject')}
              </button>
              <button onClick={() => setShowTemplateDialog(true)} className="w-full px-3 py-2 text-sm rounded font-medium transition-colors btn-ctp-green">
                {t('toolbar.newProject')}
              </button>
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <TabsBar tabs={openTabs.map(p => ({ path: p }))} activePath={currentFile} onSelect={setCurrentFile} onClose={closeTab} />
            <div className="flex-1 min-h-0">
              <Editor ref={editorRef} filePath={currentFile} projectPath={projectPath} settings={ideSettings}
                onConsoleOutput={handleConsoleOutput} onConsoleError={handleConsoleError} onScriptStart={() => {}} onScriptStop={() => {}} />
            </div>
            <div className="h-48 border-t flex-shrink-0" style={{ borderColor: 'var(--ctp-surface1)' }}>
              <Console projectPath={projectPath} messages={consoleMessages} onClearMessages={() => setConsoleMessages([])} />
            </div>
          </div>

          {/* Debug Panel */}
          <div className="flex-shrink-0 border-l transition-[width,opacity] duration-200 ease-in-out"
            style={{ width: showDebugPanel ? '20rem' : 0, opacity: showDebugPanel ? 1 : 0,
              pointerEvents: showDebugPanel ? 'auto' : 'none', backgroundColor: 'var(--ctp-mantle)', borderColor: 'var(--ctp-surface1)' }}>
            <div style={{ display: showDebugPanel ? 'block' : 'none', height: '100%' }}>
              <DebugPanel isVisible={showDebugPanel} isDebugging={isDebugging} onClose={() => setShowDebugPanel(false)}
                breakpoints={debugBreakpoints} outputMessages={debugOutputMessages} onNavigateToLocation={handleNavigateToLocation} />
            </div>
          </div>

          {/* Project Panel */}
          <div className="flex-shrink-0 border-l transition-[width,opacity] duration-200 ease-in-out"
            style={{ width: showProjectPanel ? '20rem' : 0, opacity: showProjectPanel ? 1 : 0,
              pointerEvents: showProjectPanel ? 'auto' : 'none', backgroundColor: 'var(--ctp-base)', borderColor: 'var(--ctp-surface1)' }}>
            <div style={{ display: showProjectPanel ? 'block' : 'none', height: '100%' }}>
              <ProjectPanel projectPath={projectPath} onConsoleOutput={handleConsoleOutput} onConsoleError={handleConsoleError} />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0">
        <StatusBar currentFile={currentFile} uvReady={uvReady} uvInstalling={uvInstalling}
          isDebugging={isDebugging} debugPanelVisible={showDebugPanel} onShowDebugPanel={() => setShowDebugPanel(true)} />
      </div>

      {/* Dialogs */}
      <SettingsPanel isOpen={showSettingsPanel} onClose={() => setShowSettingsPanel(false)} onSettingsChange={handleSettingsChange} />
      <ProjectTemplateDialog isOpen={showTemplateDialog} onClose={() => setShowTemplateDialog(false)} onCreateProject={handleCreateProject} />
      <VenvDialog isOpen={showVenvDialog} onCreateVenv={handleCreateVenv} onSkip={() => { setShowVenvDialog(false); handleConsoleOutput(t('messages.venvSkipped')) }} />
    </div>
  )
}

export default App
