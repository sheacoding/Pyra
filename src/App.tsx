import { useState, useEffect, useRef } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { LogicalSize } from '@tauri-apps/api/window'
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

function App() {
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [projectPath, setProjectPath] = useState<string>('E:\\Code\\Pyra\\test-project')
  const [consoleMessages, setConsoleMessages] = useState<Array<{id: string, content: string, type: 'stdout' | 'stderr' | 'error' | 'info', timestamp: Date}>>([])
  const [showProjectPanel, setShowProjectPanel] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [ideSettings, setIdeSettings] = useState<IDESettings | null>(null)
  const [showVenvDialog, setShowVenvDialog] = useState(false)
  const [, setVenvExists] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [uvReady, setUvReady] = useState(false)
  const [uvInstalling, setUvInstalling] = useState(false)
  const editorRef = useRef<EditorHandle | null>(null)
  const fileTreeRef = useRef<FileTreeHandle | null>(null)

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
        const maximized = await window.isMaximized()
        setIsMaximized(maximized)
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

  const handleConsoleOutput = (output: string) => {
    const message = {
      id: Date.now().toString() + Math.random(),
      content: output.replace(/\n$/, ''), // Remove trailing newline
      type: 'stdout' as const,
      timestamp: new Date()
    }
    setConsoleMessages(prev => [...prev, message])
  }

  const handleConsoleError = (error: string) => {
    const message = {
      id: Date.now().toString() + Math.random(),
      content: error.replace(/\n$/, ''), // Remove trailing newline
      type: 'error' as const,
      timestamp: new Date()
    }
    setConsoleMessages(prev => [...prev, message])
  }

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
        handleConsoleOutput(`[FILE] Opened file: ${filePath}`)
      }
    } catch (error) {
      handleConsoleError(`❌ Failed to open file: ${error}`)
    }
  }

  const handleSaveFile = async () => {
    if (!currentFile) return
    try {
      const content = editorRef.current?.getContent() || ''
      const { TauriAPI } = await import('./lib/tauri')
      await TauriAPI.writeFile(currentFile, content)
      handleConsoleOutput(`[SAVE] Saved: ${currentFile}`)
    } catch (error) {
      handleConsoleError(`❌ Failed to save file: ${error}`)
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
        handleConsoleOutput(`[SAVE] Saved as: ${newPath}`)
      }
    } catch (error) {
      handleConsoleError(`❌ Failed to save file as: ${error}`)
    }
  }

  const editorRun = () => editorRef.current?.run()
  const editorStop = () => editorRef.current?.stop()
  const editorFormat = () => editorRef.current?.format()
  const editorLint = () => editorRef.current?.lint()

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
    setIdeSettings(settings)
    // Here you could apply the settings to various components
    console.log('Settings updated:', settings)
  }

  const handleCreateVenv = async (pythonVersion: string = '3.11') => {
    try {
      const { TauriAPI } = await import('./lib/tauri')
      handleConsoleOutput(`Creating virtual environment with Python ${pythonVersion}...`)
      
      const result = await TauriAPI.createVenv(projectPath, pythonVersion)
      handleConsoleOutput(`✅ Virtual environment created successfully`)
      handleConsoleOutput(result)
      
      setVenvExists(true)
      setShowVenvDialog(false)
    } catch (error) {
      handleConsoleError(`❌ Failed to create virtual environment: ${error}`)
    }
  }

  const handleSkipVenv = () => {
    setShowVenvDialog(false)
    handleConsoleOutput('⚠️ Skipping virtual environment creation - you can create it later from the Project Panel')
  }

  const handleCreateProject = (projectName: string, newProjectPath: string) => {
    handleConsoleOutput(`✅ Project '${projectName}' created successfully from template!`)
    handleConsoleOutput(`[PROJECT] Project location: ${newProjectPath}`)
    
    // Auto-open the newly created project
    setProjectPath(newProjectPath)
    setCurrentFile(null) // Reset current file
    handleConsoleOutput(`[PROJECT] Switched to project: ${projectName}`)
  }

  const handleOpenProject = async () => {
    try {
      const { TauriAPI } = await import('./lib/tauri')
      const selectedPath = await TauriAPI.openProjectDialog()
      
      if (selectedPath) {
        setProjectPath(selectedPath)
        setCurrentFile(null) // Reset current file
        const projectName = selectedPath.split('\\').pop() || selectedPath.split('/').pop()
        handleConsoleOutput(`[PROJECT] Opened project: ${projectName}`)
        handleConsoleOutput(`[PROJECT] Project location: ${selectedPath}`)
      }
    } catch (error) {
      handleConsoleError(`❌ Failed to open project: ${error}`)
    }
  }

  useEffect(() => {
    // In a real app, this would be set by opening a project
    console.log('Pyra IDE initialized with project:', projectPath)
  }, [])

  // Apply theme to document root when settings change
  useEffect(() => {
    if (ideSettings?.theme?.uiTheme) {
      const theme = ideSettings.theme.uiTheme
      if (theme.startsWith('catppuccin-')) {
        document.documentElement.setAttribute('data-theme', theme)
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    }
  }, [ideSettings?.theme?.uiTheme])

  const minimizeWindow = async () => {
    try { await getCurrentWindow().minimize() } catch (e) { console.error('Minimize failed', e) }
  }
  const toggleMaximizeWindow = async () => {
    try {
      await getCurrentWindow().toggleMaximize()
      // Update state immediately after toggle
      const maximized = await getCurrentWindow().isMaximized()
      setIsMaximized(maximized)
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
            <span className="text-xs font-semibold select-none" style={{ color: 'var(--ctp-text)' }}>Pyra</span>
          </div>
          <div className="flex items-center gap-1 ml-1">
            <button data-tauri-drag-region="false" onClick={explorerNewFile} className="w-7 h-7 rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-yellow)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-peach)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-yellow)' }} type="button" title="New File"><i className="fas fa-plus text-sm"></i></button>
            <button data-tauri-drag-region="false" onClick={explorerNewFolder} className="w-7 h-7 rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-sapphire)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-blue)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }} type="button" title="New Folder"><i className="fas fa-folder-plus text-sm"></i></button>
            <button data-tauri-drag-region="false" onClick={handleOpenFile} className="w-7 h-7 rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-green)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-teal)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-green)' }} type="button" title="Open File"><i className="fas fa-folder-open text-sm"></i></button>
            <button data-tauri-drag-region="false" onClick={handleSaveFile} disabled={!currentFile} className="w-7 h-7 rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: !currentFile ? 'var(--ctp-surface2)' : 'var(--ctp-blue)', color: !currentFile ? 'var(--ctp-subtext0)' : 'var(--ctp-base)' }} onMouseEnter={(e) => { if (currentFile) e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }} onMouseLeave={(e) => { if (currentFile) e.currentTarget.style.backgroundColor = 'var(--ctp-blue)' }} type="button" title="Save"><i className="fas fa-save text-sm"></i></button>
            <button data-tauri-drag-region="false" onClick={handleSaveAsFile} disabled={!currentFile} className="w-7 h-7 rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: !currentFile ? 'var(--ctp-surface2)' : 'var(--ctp-mauve)', color: !currentFile ? 'var(--ctp-subtext0)' : 'var(--ctp-base)' }} onMouseEnter={(e) => { if (currentFile) e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)' }} onMouseLeave={(e) => { if (currentFile) e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)' }} type="button" title="Save As"><i className="fas fa-copy text-sm"></i></button>
            <button data-tauri-drag-region="false" onClick={explorerRefresh} className="w-7 h-7 rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-teal)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sky)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-teal)' }} type="button" title="Refresh"><i className="fas fa-sync-alt text-sm"></i></button>
          </div>
        </div>

        {/* Center segment: editor actions */}
        <div className="flex-1 flex items-center px-2 gap-2">
          <button data-tauri-drag-region="false" onClick={editorRun} disabled={!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling} className="w-7 h-7 rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-green)', color: 'var(--ctp-base)', opacity: (!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling) ? 0.6 : 1 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-teal)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-green)' }} type="button" title="Run"><i className="fas fa-play text-sm"></i></button>
          <button data-tauri-drag-region="false" onClick={editorStop} className="w-7 h-7 rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-red)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-maroon)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-red)' }} type="button" title="Stop"><i className="fas fa-stop text-sm"></i></button>
          <button data-tauri-drag-region="false" onClick={editorFormat} disabled={!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling} className="w-7 h-7 rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-blue)', color: 'var(--ctp-base)', opacity: (!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling) ? 0.6 : 1 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-blue)' }} type="button" title="Format"><i className="fas fa-palette text-sm"></i></button>
          <button data-tauri-drag-region="false" onClick={editorLint} disabled={!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling} className="w-7 h-7 rounded font-medium transition-colors flex items-center justify-center" style={{ backgroundColor: 'var(--ctp-mauve)', color: 'var(--ctp-base)', opacity: (!currentFile || !currentFile.endsWith('.py') || !uvReady || uvInstalling) ? 0.6 : 1 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)' }} type="button" title="Lint"><i className="fas fa-search text-sm"></i></button>

          {/* 拖拽区域 - 中央空白区域 */}
          <div className="flex-1 min-w-[100px] h-full" title="拖拽此区域移动窗口"></div>

          {/* Right segment separator inside center area */}
          <div className="h-6 w-px mx-2" style={{ backgroundColor: 'var(--ctp-surface2)' }}></div>

          {/* Project actions + Settings on right */}
          <div className="ml-auto flex items-center gap-2">
          <button data-tauri-drag-region="false"
            onClick={() => setShowTemplateDialog(true)}
            className="w-7 h-7 rounded font-medium transition-colors cursor-pointer select-none flex items-center justify-center"
            style={{ backgroundColor: 'var(--ctp-green)', color: 'var(--ctp-base)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-teal)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-green)' }}
            type="button"
            title="New Project"><i className="fas fa-rocket text-sm"></i></button>
          <button data-tauri-drag-region="false"
            onClick={handleOpenProject}
            className="w-7 h-7 rounded font-medium transition-colors cursor-pointer select-none flex items-center justify-center"
            style={{ backgroundColor: 'var(--ctp-blue)', color: 'var(--ctp-base)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-blue)' }}
            type="button"
            title="Open Project"><i className="fas fa-folder-open text-sm"></i></button>
          <button data-tauri-drag-region="false"
            onClick={(e) => handleToggleProjectPanel(e)}
            className="w-7 h-7 rounded font-medium transition-colors cursor-pointer select-none flex items-center justify-center"
            style={{ backgroundColor: showProjectPanel ? 'var(--ctp-blue)' : 'var(--ctp-surface2)', color: showProjectPanel ? 'var(--ctp-base)' : 'var(--ctp-text)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = showProjectPanel ? 'var(--ctp-sapphire)' : 'var(--ctp-overlay0)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = showProjectPanel ? 'var(--ctp-blue)' : 'var(--ctp-surface2)' }}
            type="button"
            aria-pressed={showProjectPanel}
            title={showProjectPanel ? 'Hide Project Panel' : 'Show Project Panel'}
          ><i className="fas fa-clipboard-list text-sm"></i></button>
          <button data-tauri-drag-region="false"
            onClick={handleOpenSettings}
            className="w-7 h-7 rounded font-medium transition-colors cursor-pointer select-none flex items-center justify-center"
            style={{ backgroundColor: 'var(--ctp-mauve)', color: 'var(--ctp-base)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)' }}
            type="button"
            title="Settings"><i className="fas fa-cog text-sm"></i></button>

          {/* Window controls */}
          <div className="window-controls ml-2 flex items-center gap-2" data-tauri-drag-region="false">
            <button
              data-tauri-drag-region="false"
              onClick={minimizeWindow}
              className="w-7 h-7 rounded font-medium transition-colors no-drag flex items-center justify-center"
              style={{ backgroundColor: 'var(--ctp-lavender)', color: 'var(--ctp-base)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)' }}
              type="button"
              title="Minimize"
            >—</button>
            <button
              data-tauri-drag-region="false"
              onClick={toggleMaximizeWindow}
              className="w-7 h-7 rounded font-medium transition-colors no-drag flex items-center justify-center"
              style={{ backgroundColor: 'var(--ctp-sky)', color: 'var(--ctp-base)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sky)' }}
              type="button"
              title="Maximize/Restore"
            >▢</button>
            <button
              data-tauri-drag-region="false"
              onClick={closeWindow}
              className="w-7 h-7 rounded font-medium transition-colors no-drag flex items-center justify-center"
              style={{ backgroundColor: 'var(--ctp-red)', color: 'var(--ctp-base)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-maroon)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-red)' }}
              type="button"
              title="Close"
            >✕</button>
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
            <h3 className="text-xl font-bold text-white mb-4"><i className="fab fa-python text-2xl"></i> Setup Python Environment</h3>
            <p className="text-gray-300 mb-6">
              No virtual environment found for this project. Would you like to create one? 
              This will help manage your Python packages and dependencies.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Python Version</label>
              <select 
                id="python-version"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                defaultValue="3.11"
              >
                <option value="3.12">Python 3.12</option>
                <option value="3.11">Python 3.11 (Recommended)</option>
                <option value="3.10">Python 3.10</option>
                <option value="3.9">Python 3.9</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleSkipVenv}
                className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={() => {
                  const select = document.getElementById('python-version') as HTMLSelectElement
                  handleCreateVenv(select.value)
                }}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                <i className="fas fa-rocket"></i> Create Environment
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-700 rounded text-xs text-gray-400">
              <i className="fas fa-lightbulb"></i> Tip: You can always create or manage virtual environments later from the Project Panel
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
