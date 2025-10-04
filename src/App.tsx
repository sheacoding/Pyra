import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { FileTree } from './components/FileTree'
import type { FileTreeHandle } from './components/FileTree'
import { Editor } from './components/Editor'
import type { EditorHandle } from './components/Editor'
import { Console } from './components/Console'
import { StatusBar } from './components/StatusBar'
import { ProjectPanel } from './components/ProjectPanel'
import { SettingsPanel } from './components/SettingsPanel'
import type { IDESettings } from './components/SettingsPanel'
import { ProjectTemplateDialog } from './components/ProjectTemplateDialog'
import { TabsBar } from './components/TabsBar'
import { DebugPanel } from './components/DebugPanel'
import { TauriAPI } from './lib/tauri'

function App() {
  const { t } = useTranslation()
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [projectPath, setProjectPath] = useState<string>('E:\\Code\\Pyra\\test-project')
  const [consoleMessages, setConsoleMessages] = useState<Array<{id: string, content: string, type: 'stdout' | 'stderr' | 'error' | 'info', timestamp: Date}>>([])
  const [showProjectPanel, setShowProjectPanel] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [ideSettings, setIdeSettings] = useState<IDESettings | null>(null)

  // Load settings on app initialization
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('pyra-settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          console.log('[APP] Loading saved settings:', parsed)
          setIdeSettings(parsed)
          return parsed
        } catch (error) {
          console.error('Failed to parse saved settings:', error)
        }
      }

      // Set default settings if none exist
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

      console.log('[APP] Using default settings:', defaultSettings)
      setIdeSettings(defaultSettings)
      localStorage.setItem('pyra-settings', JSON.stringify(defaultSettings))
      return defaultSettings
    }

    const settings = loadSettings()

    // Apply initial theme immediately
    if (settings?.theme?.uiTheme) {
      applyThemeToDocument(settings.theme.uiTheme)
    }
  }, [])

  // Helper function to apply theme to document
  const applyThemeToDocument = (theme: string) => {
    console.log('[APP] Applying theme to document:', theme)

    if (theme.startsWith('catppuccin-')) {
      document.documentElement.setAttribute('data-theme', theme)
      document.body.setAttribute('data-theme', theme)

      // Force CSS variable updates based on theme
      const root = document.documentElement
      if (theme === 'catppuccin-latte') {
        root.style.setProperty('--ctp-base', '#eff1f5')
        root.style.setProperty('--ctp-text', '#4c4f69')
        root.style.setProperty('--ctp-mantle', '#e6e9ef')
        root.style.setProperty('--ctp-crust', '#dce0e8')
        root.style.setProperty('--ctp-surface0', '#ccd0da')
        root.style.setProperty('--ctp-surface1', '#bcc0cc')
        root.style.setProperty('--ctp-surface2', '#acb0be')
        root.style.setProperty('--ctp-overlay0', '#9ca0b0')
        root.style.setProperty('--ctp-overlay1', '#8c8fa1')
        root.style.setProperty('--ctp-overlay2', '#7c7f93')
        root.style.setProperty('--ctp-subtext1', '#5c5f77')
        root.style.setProperty('--ctp-subtext0', '#6c6f85')
        root.style.setProperty('--ctp-rosewater', '#dc8a78')
        root.style.setProperty('--ctp-flamingo', '#dd7878')
        root.style.setProperty('--ctp-pink', '#ea76cb')
        root.style.setProperty('--ctp-mauve', '#8839ef')
        root.style.setProperty('--ctp-red', '#d20f39')
        root.style.setProperty('--ctp-maroon', '#e64553')
        root.style.setProperty('--ctp-peach', '#fe640b')
        root.style.setProperty('--ctp-yellow', '#df8e1d')
        root.style.setProperty('--ctp-green', '#40a02b')
        root.style.setProperty('--ctp-teal', '#179299')
        root.style.setProperty('--ctp-sky', '#04a5e5')
        root.style.setProperty('--ctp-sapphire', '#209fb5')
        root.style.setProperty('--ctp-blue', '#1e66f5')
        root.style.setProperty('--ctp-lavender', '#7287fd')
      } else {
        // Mocha theme
        root.style.setProperty('--ctp-base', '#1e1e2e')
        root.style.setProperty('--ctp-text', '#cdd6f4')
        root.style.setProperty('--ctp-mantle', '#181825')
        root.style.setProperty('--ctp-crust', '#11111b')
        root.style.setProperty('--ctp-surface0', '#313244')
        root.style.setProperty('--ctp-surface1', '#45475a')
        root.style.setProperty('--ctp-surface2', '#585b70')
        root.style.setProperty('--ctp-overlay0', '#6c7086')
        root.style.setProperty('--ctp-overlay1', '#7f849c')
        root.style.setProperty('--ctp-overlay2', '#9399b2')
        root.style.setProperty('--ctp-subtext1', '#bac2de')
        root.style.setProperty('--ctp-subtext0', '#a6adc8')
        root.style.setProperty('--ctp-rosewater', '#f5e0dc')
        root.style.setProperty('--ctp-flamingo', '#f2cdcd')
        root.style.setProperty('--ctp-pink', '#f5c2e7')
        root.style.setProperty('--ctp-mauve', '#cba6f7')
        root.style.setProperty('--ctp-red', '#f38ba8')
        root.style.setProperty('--ctp-maroon', '#eba0ac')
        root.style.setProperty('--ctp-peach', '#fab387')
        root.style.setProperty('--ctp-yellow', '#f9e2af')
        root.style.setProperty('--ctp-green', '#a6e3a1')
        root.style.setProperty('--ctp-teal', '#94e2d5')
        root.style.setProperty('--ctp-sky', '#89dceb')
        root.style.setProperty('--ctp-sapphire', '#74c7ec')
        root.style.setProperty('--ctp-blue', '#87ceeb')
        root.style.setProperty('--ctp-lavender', '#b4befe')
      }
      console.log('✅ [APP] CSS variables updated for theme:', theme)

      // Force repaint
      document.body.style.display = 'none'
      document.body.offsetHeight // Trigger reflow
      document.body.style.display = ''
    } else {
      document.documentElement.removeAttribute('data-theme')
      document.body.removeAttribute('data-theme')
    }
  }
  const [showVenvDialog, setShowVenvDialog] = useState(false)
  const [, setVenvExists] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [uvReady, setUvReady] = useState(false)
  const [uvInstalling, setUvInstalling] = useState(false)
  const [showDebugMenu, setShowDebugMenu] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [isDebugging, setIsDebugging] = useState(false)
  const editorRef = useRef<EditorHandle | null>(null)
  const fileTreeRef = useRef<FileTreeHandle | null>(null)
  const debugMenuRef = useRef<HTMLDivElement | null>(null)
  const debugStopRequestedRef = useRef(false)

  // Disable browser shortcuts and context menu for desktop app experience
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Disable developer tools and other browser shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 - Developer Tools
      if (e.key === 'F12') {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+I - Developer Tools
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+J - Console
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault()
        return false
      }

      // Ctrl+U - View Source
      if (e.ctrlKey && e.key === 'U') {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+C - Element Inspector
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        return false
      }

      // F5 and Ctrl+R - Refresh (optional, comment out if you want refresh)
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+R - Hard Refresh
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        return false
      }

      // Alt+F4 - Let this through for window closing
      // Ctrl+W - Let this through for tab closing if needed
    }

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup event listeners
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Ensure uv exists and then check venv when project loads
  useEffect(() => {
    (async () => {
      try {
        const { TauriAPI } = await import('./lib/tauri')
        const hasUv = await TauriAPI.checkUvInstalled()
        if (!hasUv) {
          setUvInstalling(true)
          try {
            await TauriAPI.ensureUvInstalled()
            setUvReady(true)
          } catch (e) {
            console.error('Failed to ensure uv installed:', e)
            setUvReady(false)
          } finally {
            setUvInstalling(false)
          }
        } else {
          setUvReady(true)
        }
      } catch (e) {
        console.error('UV ensure step failed:', e)
      }
    })()

    const checkVenv = async () => {
      if (!projectPath) return

      try {
        // Import TauriAPI dynamically to avoid import issues
        const { TauriAPI } = await import('./lib/tauri')
        const exists = await TauriAPI.checkVenvExists(projectPath)
        setVenvExists(exists)

        // Show dialog if no venv exists
        if (!exists) {
          // Wait a bit to avoid showing dialog immediately on startup
          setTimeout(() => setShowVenvDialog(true), 1500)
        }
      } catch (error) {
        console.error('Failed to check venv:', error)
      }
    }

    checkVenv()
  }, [projectPath])

  // Ensure proper window initialization in production builds
  useEffect(() => {
    const initializeWindow = async () => {
      try {
        const window = getCurrentWindow()

        // Ensure window is visible and has correct size in production
        const isVisible = await window.isVisible()
        if (!isVisible) {
          await window.show()
        }

        // Check if window size is too small (indicates initialization issue)
        const size = await window.innerSize()
        if (size.width < 800 || size.height < 600) {
          console.log('Window too small, resizing to default size')
          await window.setSize(new LogicalSize(1200, 800))
          await window.center()
        }
      } catch (error) {
        console.error('Failed to initialize window:', error)
      }
    }

    // Small delay to ensure Tauri is fully initialized
    const timer = setTimeout(initializeWindow, 100)
    return () => clearTimeout(timer)
  }, [])

  // Monitor window maximization state
  useEffect(() => {
    const checkWindowState = async () => {
      try {
        const window = getCurrentWindow()
        await window.isMaximized()
        // maximized state not currently used
      } catch (error) {
        console.error('Failed to check window state:', error)
      }
    }

    // Check initial state
    checkWindowState()

    // Listen for window resize events
    const handleResize = () => {
      checkWindowState()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleConsoleOutput = useCallback((output: string) => {
    const message = {
      id: Date.now().toString() + Math.random(),
      content: output.replace(/\n$/, ''), // Remove trailing newline
      type: 'stdout' as const,
      timestamp: new Date()
    }
    setConsoleMessages(prev => [...prev, message])
  }, [])

  const handleConsoleError = useCallback((error: string) => {
    const message = {
      id: Date.now().toString() + Math.random(),
      content: error.replace(/\n$/, ''), // Remove trailing newline
      type: 'error' as const,
      timestamp: new Date()
    }
    setConsoleMessages(prev => [...prev, message])
  }, [])

  useEffect(() => {
    let unlistenStopped: UnlistenFn | undefined
    let unlistenContinued: UnlistenFn | undefined
    let unlistenTerminated: UnlistenFn | undefined
    let unlistenOutput: UnlistenFn | undefined

    const setupDebugListeners = async () => {
      try {
        unlistenStopped = await listen<{ reason?: string; threadId?: number }>('debug-stopped', () => {
          debugStopRequestedRef.current = false
          setIsDebugging(true)
          setShowDebugPanel(true)
        })

        unlistenContinued = await listen('debug-continued', () => {
          setIsDebugging(true)
        })

        unlistenTerminated = await listen('debug-terminated', () => {
          setIsDebugging(false)
          setShowDebugPanel(false)

          if (debugStopRequestedRef.current) {
            debugStopRequestedRef.current = false
          } else {
            handleConsoleOutput(t('messages.debugStopped') + '\n')
          }
        })

        unlistenOutput = await listen<{ category?: string; output?: string }>('debug-output', (event) => {
          const { category, output } = event.payload ?? {}

          if (!output) {
            return
          }

          const normalized = output.replace(/\r?\n$/, '')

          if (category === 'stderr') {
            handleConsoleError(normalized)
          } else {
            handleConsoleOutput(normalized)
          }
        })
      } catch (error) {
        console.error('Failed to set up debug listeners:', error)
      }
    }

    setupDebugListeners()

    return () => {
      unlistenStopped?.()
      unlistenContinued?.()
      unlistenTerminated?.()
      unlistenOutput?.()
    }
  }, [handleConsoleError, handleConsoleOutput, t])

  const handleToggleProjectPanel = (e?: React.MouseEvent) => {
    // 确保阻止事件冒泡和默认行为
    e?.preventDefault()
    e?.stopPropagation()

    console.log('Toggle project panel clicked, current state:', showProjectPanel)
    setShowProjectPanel(prev => {
      const newState = !prev
      console.log('Setting showProjectPanel to:', newState)
      return newState
    })
  }

  const handleClearConsole = () => {
    setConsoleMessages([])
  }

  const handleOpenSettings = () => {
    setShowSettingsPanel(true)
  }

  const handleCloseSettings = () => {
    setShowSettingsPanel(false)
  }

  // Global toolbar actions
  const explorerNewFile = () => fileTreeRef.current?.openNewFileDialog()
  const explorerNewFolder = () => fileTreeRef.current?.openNewFolderDialog()
  const explorerRefresh = () => fileTreeRef.current?.refresh()

  // File operations
  const handleOpenFile = async () => {
    try {
      const { TauriAPI } = await import('./lib/tauri')
      const filePath = await TauriAPI.openFileDialog()
      if (filePath) {
        setCurrentFile(filePath)
        if (!openTabs.includes(filePath)) {
          setOpenTabs(prev => [...prev, filePath])
        }
        handleConsoleOutput(t('messages.fileOpened', { path: filePath }))
      }
    } catch (error) {
      handleConsoleError(t('messages.openFileFailed', { error: String(error) }))
    }
  }

  const handleSaveFile = async () => {
    if (!currentFile) return
    try {
      const content = editorRef.current?.getContent() || ''
      const { TauriAPI } = await import('./lib/tauri')
      await TauriAPI.writeFile(currentFile, content)
      handleConsoleOutput(t('messages.fileSaved', { path: currentFile }))
    } catch (error) {
      handleConsoleError(t('messages.saveFileFailed', { error: String(error) }))
    }
  }

  const handleSaveAsFile = async () => {
    if (!currentFile) return
    try {
      const content = editorRef.current?.getContent() || ''
      const { TauriAPI } = await import('./lib/tauri')
      const newPath = await TauriAPI.saveFileDialog()
      if (newPath) {
        await TauriAPI.writeFile(newPath, content)
        setCurrentFile(newPath)
        if (!openTabs.includes(newPath)) {
          setOpenTabs(prev => [...prev, newPath])
        }
        handleConsoleOutput(t('messages.fileSavedAs', { path: newPath }))
      }
    } catch (error) {
      handleConsoleError(t('messages.saveFileFailed', { error: String(error) }))
    }
  }

  const editorRun = () => editorRef.current?.run()

  // Stop debugging session
  const handleStopDebugging = async () => {
    debugStopRequestedRef.current = true
    try {
      await TauriAPI.stopDebugSession()
      setIsDebugging(false)
      setShowDebugPanel(false)
      handleConsoleOutput(t('messages.debugStopped') + '\n')
    } catch (error) {
      debugStopRequestedRef.current = false
      console.error('Failed to stop debugging:', error)
    }
  }

  const editorStop = () => {
    if (isDebugging) {
      handleStopDebugging()
    } else {
      editorRef.current?.stop()
    }
  }
  const editorFormat = () => editorRef.current?.format()
  const editorLint = () => editorRef.current?.lint()

  // Debug menu handlers
  const handleDebugMode = async (_mode: 'debug' | 'step' | 'visual') => {  // mode reserved for future use
    setShowDebugMenu(false)
    debugStopRequestedRef.current = false

    if (!currentFile || !currentFile.endsWith('.py')) {
      handleConsoleError(t('messages.pythonFileOnly'))
      return
    }

    if (!projectPath) {
      handleConsoleError('No project open')
      return
    }

    // If already debugging, just show the panel
    if (isDebugging) {
      setShowDebugPanel(true)
      return
    }

    try {
      handleConsoleOutput(t('messages.debugStarting') + '\n')

      // Get breakpoints from editor
      const breakpoints = editorRef.current?.getBreakpoints?.() || []

      if (breakpoints.length === 0) {
        handleConsoleOutput(t('messages.noBreakpoints') + '\n')
      }

      // Convert to API format
      const apiBreakpoints = breakpoints.map(line => ({
        file: currentFile,
        line,
        verified: false
      }))

      console.debug('[APP] Starting debug session with', {
        projectPath,
        scriptPath: currentFile,
        breakpoints,
        apiBreakpoints
      })

      // Start debug session
      await TauriAPI.startDebugSession(
        projectPath,
        currentFile,
        apiBreakpoints
      )

      setIsDebugging(true)
      setShowDebugPanel(true)
      handleConsoleOutput(t('messages.debugStarted') + '\n')

    } catch (error) {
      handleConsoleError(t('messages.debugError', { error: String(error) }) + '\n')
      console.error('Debug error:', error)
      // Reset states on error
      setIsDebugging(false)
      setShowDebugPanel(false)
    }
  }

  // Close debug menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (debugMenuRef.current && !debugMenuRef.current.contains(event.target as Node)) {
        setShowDebugMenu(false)
      }
    }

    if (showDebugMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDebugMenu])

  // Tab management
  const openFileInTab = (path: string) => {
    setOpenTabs(prev => (prev.includes(path) ? prev : [...prev, path]))
    setCurrentFile(path)
  }

  const closeTab = (path: string) => {
    setOpenTabs(prev => prev.filter(p => p !== path))
    if (currentFile === path) {
      // Choose a sensible next active tab
      setCurrentFile(() => {
        const currentIndex = openTabs.indexOf(path)
        const remaining = openTabs.filter(p => p !== path)
        if (remaining.length === 0) return null
        const nextIndex = Math.max(0, Math.min(currentIndex - 1, remaining.length - 1))
        return remaining[nextIndex]
      })
    }
  }

  const selectTab = (path: string) => setCurrentFile(path)

  const handleSettingsChange = (settings: IDESettings) => {
    console.log('[APP] Settings changed:', settings)
    setIdeSettings(settings)

    // Apply theme immediately when settings change
    if (settings.theme?.uiTheme) {
      applyThemeToDocument(settings.theme.uiTheme)
    }
  }

  const handleCreateVenv = async (pythonVersion: string = '3.11') => {
    try {
      const { TauriAPI } = await import('./lib/tauri')
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

  const handleSkipVenv = () => {
    setShowVenvDialog(false)
    handleConsoleOutput(t('messages.venvSkipped'))
  }

  const handleCreateProject = (projectName: string, newProjectPath: string) => {
    handleConsoleOutput(t('messages.projectCreated', { name: projectName }))
    handleConsoleOutput(t('messages.projectLocation', { path: newProjectPath }))

    // Auto-open the newly created project
    setProjectPath(newProjectPath)
    setCurrentFile(null) // Reset current file
    handleConsoleOutput(t('messages.projectSwitched', { name: projectName }))
  }

  const handleOpenProject = async () => {
    try {
      const { TauriAPI } = await import('./lib/tauri')
      const selectedPath = await TauriAPI.openProjectDialog()

      if (selectedPath) {
        setProjectPath(selectedPath)
        setCurrentFile(null) // Reset current file
        const projectName = selectedPath.split('\\').pop() || selectedPath.split('/').pop()
        handleConsoleOutput(t('messages.projectOpened', { name: projectName }))
        handleConsoleOutput(t('messages.projectLocation', { path: selectedPath }))
      }
    } catch (error) {
      handleConsoleError(t('messages.openProjectFailed', { error: String(error) }))
    }
  }

  useEffect(() => {
    // In a real app, this would be set by opening a project
    console.log('Pyra IDE initialized with project:', projectPath)
  }, [])

  // Apply theme to document root when settings change
  useEffect(() => {
    if (ideSettings?.theme?.uiTheme) {
      applyThemeToDocument(ideSettings.theme.uiTheme)
    }
  }, [ideSettings?.theme?.uiTheme])

  const minimizeWindow = async () => {
    try { await getCurrentWindow().minimize() } catch (e) { console.error('Minimize failed', e) }
  }
  const toggleMaximizeWindow = async () => {
    try {
      await getCurrentWindow().toggleMaximize()
      // Update state immediately after toggle
      await getCurrentWindow().isMaximized()
      // maximized state not currently used
    } catch (e) { console.error('Toggle maximize failed', e) }
  }
  const closeWindow = async () => {
    try { await getCurrentWindow().close() } catch (e) { console.error('Close failed', e) }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--ctp-base)' }}>
      {/* Unified Header + Toolbar (draggable except controls) */}
      <div className="titlebar h-10 border-b flex items-center flex-shrink-0" data-tauri-drag-region="true"
        style={{ backgroundColor: 'var(--ctp-mantle)', borderColor: 'var(--ctp-surface1)' }}>
        {/* Left segment: matches sidebar width and border */}
        <div className="flex items-center w-48 sm:w-56 md:w-64 px-1 gap-1 border-r" style={{ borderColor: 'var(--ctp-surface1)' }}>
          <div className="flex items-center px-2 py-1 rounded opacity-90" style={{ backgroundColor: 'var(--ctp-surface0)' }}>
            <span className="text-xs font-semibold select-none" style={{ color: 'var(--ctp-text)' }}>{t('app.title')}</span>
          </div>
          <div className="flex items-center gap-1 ml-1">
            <button data-tauri-drag-region="false" onClick={explorerNewFile} className="toolbar-button rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-yellow)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-peach)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-yellow)' }} type="button" title={t('toolbar.newFile')}><i className="fas fa-plus text-sm"></i></button>
            <button data-tauri-drag-region="false" onClick={explorerNewFolder} className="toolbar-button rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-sapphire)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-blue)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }} type="button" title={t('toolbar.newFolder')}><i className="fas fa-folder-plus text-sm"></i></button>
            <button data-tauri-drag-region="false" onClick={handleOpenFile} className="toolbar-button rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-green)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-teal)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-green)' }} type="button" title={t('toolbar.openFile')}><i className="fas fa-folder-open text-sm"></i></button>
            <button data-tauri-drag-region="false" onClick={handleSaveFile} disabled={!currentFile} className="toolbar-button rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: !currentFile ? 'var(--ctp-surface2)' : 'var(--ctp-blue)', color: !currentFile ? 'var(--ctp-subtext0)' : 'var(--ctp-base)' }} onMouseEnter={(e) => { if (currentFile) e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }} onMouseLeave={(e) => { if (currentFile) e.currentTarget.style.backgroundColor = 'var(--ctp-blue)' }} type="button" title={t('toolbar.save')}><i className="fas fa-save text-sm"></i></button>
            <button data-tauri-drag-region="false" onClick={handleSaveAsFile} disabled={!currentFile} className="toolbar-button rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: !currentFile ? 'var(--ctp-surface2)' : 'var(--ctp-mauve)', color: !currentFile ? 'var(--ctp-subtext0)' : 'var(--ctp-base)' }} onMouseEnter={(e) => { if (currentFile) e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)' }} onMouseLeave={(e) => { if (currentFile) e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)' }} type="button" title={t('toolbar.saveAs')}><i className="fas fa-copy text-sm"></i></button>
            <button data-tauri-drag-region="false" onClick={explorerRefresh} className="toolbar-button rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-teal)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sky)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-teal)' }} type="button" title={t('toolbar.refresh')}><i className="fas fa-sync-alt text-sm"></i></button>
          </div>
        </div>

        {/* Center segment: editor actions */}
        <div className="flex-1 flex items-center px-2 gap-2">
          <button data-tauri-drag-region="false" onClick={editorRun} disabled={!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling} className="toolbar-button rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-green)', color: 'var(--ctp-base)', opacity: (!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling) ? 0.6 : 1 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-teal)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-green)' }} type="button" title={t('toolbar.run')}><i className="fas fa-play text-sm"></i></button>
          <button data-tauri-drag-region="false" onClick={editorStop} className="toolbar-button rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-red)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-maroon)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-red)' }} type="button" title={t('toolbar.stop')}><i className="fas fa-stop text-sm"></i></button>

          {/* Debug button with dropdown menu */}
          <div className="relative" ref={debugMenuRef}>
            <button
              data-tauri-drag-region="false"
              onClick={() => setShowDebugMenu(!showDebugMenu)}
              disabled={!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling}
              className="toolbar-button rounded font-medium transition-colors flex items-center justify-center"
              style={{ backgroundColor: 'var(--ctp-peach)', color: 'var(--ctp-base)', opacity: (!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling) ? 0.6 : 1 }}
              onMouseEnter={(e) => { if (currentFile && currentFile.endsWith('.py') && uvReady && !uvInstalling) e.currentTarget.style.backgroundColor = 'var(--ctp-yellow)' }}
              onMouseLeave={(e) => { if (currentFile && currentFile.endsWith('.py') && uvReady && !uvInstalling) e.currentTarget.style.backgroundColor = 'var(--ctp-peach)' }}
              type="button"
              title={t('toolbar.debug')}
            >
              <i className="fas fa-bug text-sm"></i>
            </button>

            {/* Debug dropdown menu */}
            {showDebugMenu && (
              <div
                className="absolute top-full left-0 mt-1 rounded shadow-lg z-50 min-w-[140px]"
                style={{ backgroundColor: 'var(--ctp-surface0)', border: '1px solid var(--ctp-surface1)' }}
                data-tauri-drag-region="false"
              >
                <button
                  onClick={() => handleDebugMode('debug')}
                  className="w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2"
                  style={{ color: 'var(--ctp-text)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-surface1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <i className="fas fa-bug"></i>
                  {t('toolbar.debugMenu.debug')}
                </button>
                <button
                  onClick={() => handleDebugMode('step')}
                  className="w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2"
                  style={{ color: 'var(--ctp-text)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-surface1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <i className="fas fa-shoe-prints"></i>
                  {t('toolbar.debugMenu.stepDebug')}
                </button>
                <button
                  onClick={() => handleDebugMode('visual')}
                  className="w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2"
                  style={{ color: 'var(--ctp-text)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-surface1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <i className="fas fa-eye"></i>
                  {t('toolbar.debugMenu.visualDebug')}
                </button>
              </div>
            )}
          </div>

          <button data-tauri-drag-region="false" onClick={editorFormat} disabled={!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling} className="toolbar-button rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-blue)', color: 'var(--ctp-base)', opacity: (!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling) ? 0.6 : 1 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-blue)' }} type="button" title={t('toolbar.format')}><i className="fas fa-palette text-sm"></i></button>
          <button data-tauri-drag-region="false" onClick={editorLint} disabled={!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling} className="toolbar-button rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-mauve)', color: 'var(--ctp-base)', opacity: (!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling) ? 0.6 : 1 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)' }} type="button" title={t('toolbar.lint')}><i className="fas fa-search text-sm"></i></button>

          {/* 拖拽区域 - 中央空白区域 */}
          <div className="flex-1 min-w-[100px] h-full" title={t('app.dragHint')}></div>

          {/* Right segment separator inside center area */}
          <div className="h-6 w-px mx-2" style={{ backgroundColor: 'var(--ctp-surface2)' }}></div>

          {/* Project actions + Settings on right */}
          <div className="ml-auto flex items-center gap-2">
          <button data-tauri-drag-region="false"
            onClick={() => setShowTemplateDialog(true)}
            className="toolbar-button rounded font-medium transition-colors cursor-pointer select-none flex items-center justify-center"
            style={{ backgroundColor: 'var(--ctp-green)', color: 'var(--ctp-base)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-teal)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-green)' }}
            type="button"
            title={t('toolbar.newProject')}><i className="fas fa-rocket text-sm"></i></button>
          <button data-tauri-drag-region="false"
            onClick={handleOpenProject}
            className="toolbar-button rounded font-medium transition-colors cursor-pointer select-none flex items-center justify-center"
            style={{ backgroundColor: 'var(--ctp-blue)', color: 'var(--ctp-base)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-blue)' }}
            type="button"
            title={t('toolbar.openProject')}><i className="fas fa-folder-open text-sm"></i></button>
          <button data-tauri-drag-region="false"
            onClick={(e) => handleToggleProjectPanel(e)}
            className="toolbar-button rounded font-medium transition-colors cursor-pointer select-none flex items-center justify-center"
            style={{ backgroundColor: showProjectPanel ? 'var(--ctp-blue)' : 'var(--ctp-surface2)', color: showProjectPanel ? 'var(--ctp-base)' : 'var(--ctp-text)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = showProjectPanel ? 'var(--ctp-sapphire)' : 'var(--ctp-overlay0)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = showProjectPanel ? 'var(--ctp-blue)' : 'var(--ctp-surface2)' }}
            type="button"
            aria-pressed={showProjectPanel}
            title={showProjectPanel ? t('toolbar.hideProjectPanel') : t('toolbar.showProjectPanel')}
          ><i className="fas fa-clipboard-list text-sm"></i></button>
          <button data-tauri-drag-region="false"
            onClick={handleOpenSettings}
            className="toolbar-button rounded font-medium transition-colors cursor-pointer select-none flex items-center justify-center"
            style={{ backgroundColor: 'var(--ctp-mauve)', color: 'var(--ctp-base)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)' }}
            type="button"
            title={t('toolbar.settings')}><i className="fas fa-cog text-sm"></i></button>

          {/* Window controls */}
          <div className="window-controls ml-2 flex items-center gap-2" data-tauri-drag-region="false">
            <button
              data-tauri-drag-region="false"
              onClick={minimizeWindow}
              className="toolbar-button rounded font-medium transition-colors no-drag flex items-center justify-center"
              style={{ backgroundColor: 'var(--ctp-lavender)', color: 'var(--ctp-base)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)' }}
              type="button"
              title={t('toolbar.minimize')}
            >—</button>
            <button
              data-tauri-drag-region="false"
              onClick={toggleMaximizeWindow}
              className="toolbar-button rounded font-medium transition-colors no-drag flex items-center justify-center"
              style={{ backgroundColor: 'var(--ctp-sky)', color: 'var(--ctp-base)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sky)' }}
              type="button"
              title={t('toolbar.maximize')}
            >▢</button>
            <button
              data-tauri-drag-region="false"
              onClick={closeWindow}
              className="toolbar-button rounded font-medium transition-colors no-drag flex items-center justify-center"
              style={{ backgroundColor: 'var(--ctp-red)', color: 'var(--ctp-base)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-maroon)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-red)' }}
              type="button"
              title={t('toolbar.close')}
            ><i className="fas fa-times"></i></button>
          </div>
        </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-48 sm:w-56 md:w-64 border-r flex-shrink-0" style={{ backgroundColor: 'var(--ctp-mantle)', borderColor: 'var(--ctp-surface1)' }}>
          <FileTree 
            ref={fileTreeRef}
            projectPath={projectPath}
            onFileSelect={openFileInTab}
          />
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs Bar for multi-file editing */}
            <TabsBar
              tabs={openTabs.map(p => ({ path: p }))}
              activePath={currentFile}
              onSelect={selectTab}
              onClose={closeTab}
            />
            <div className="flex-1 min-h-0">
              <Editor
                ref={editorRef}
                filePath={currentFile}
                projectPath={projectPath}
                settings={ideSettings}
                onConsoleOutput={handleConsoleOutput}
                onConsoleError={handleConsoleError}
                onScriptStart={() => {}}
                onScriptStop={() => {}}
              />
            </div>

            {/* Console */}
            <div className="h-48 border-t flex-shrink-0" style={{ borderColor: 'var(--ctp-surface1)' }}>
              <Console projectPath={projectPath} messages={consoleMessages} onClearMessages={handleClearConsole} />
            </div>
          </div>

          {/* Debug Panel */}
          {showDebugPanel && (
            <div className="w-80 border-l flex-shrink-0" style={{ backgroundColor: 'var(--ctp-mantle)', borderColor: 'var(--ctp-surface1)' }}>
              <DebugPanel
                isVisible={showDebugPanel}
                onClose={() => setShowDebugPanel(false)}
              />
            </div>
          )}

          {/* Project Panel */}
          {showProjectPanel && (
            <div className="w-80 border-l flex-shrink-0" style={{ backgroundColor: 'var(--ctp-base)', borderColor: 'var(--ctp-surface1)' }}>
              <ProjectPanel
                projectPath={projectPath}
                onConsoleOutput={handleConsoleOutput}
                onConsoleError={handleConsoleError}
              />
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0">
        <StatusBar currentFile={currentFile} uvReady={uvReady} uvInstalling={uvInstalling} />
      </div>

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={showSettingsPanel}
        onClose={handleCloseSettings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Project Template Dialog */}
      <ProjectTemplateDialog
        isOpen={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Virtual Environment Creation Dialog */}
      {showVenvDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-90vw">
            <h3 className="text-xl font-bold text-white mb-4"><i className="fab fa-python text-2xl"></i> {t('venvDialog.title')}</h3>
            <p className="text-gray-300 mb-6">
              {t('venvDialog.message')}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('venvDialog.pythonVersion')}</label>
              <select
                id="python-version"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                defaultValue="3.11"
              >
                <option value="3.12">Python 3.12</option>
                <option value="3.11">Python 3.11 {t('venvDialog.recommended')}</option>
                <option value="3.10">Python 3.10</option>
                <option value="3.9">Python 3.9</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleSkipVenv}
                className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                {t('venvDialog.skipForNow')}
              </button>
              <button
                onClick={() => {
                  const select = document.getElementById('python-version') as HTMLSelectElement
                  handleCreateVenv(select.value)
                }}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                <i className="fas fa-rocket"></i> {t('venvDialog.createEnvironment')}
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-700 rounded text-xs text-gray-400">
              <i className="fas fa-lightbulb"></i> {t('venvDialog.tip')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
