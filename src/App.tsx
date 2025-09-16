import { useState, useEffect, useRef } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
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

function App() {
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [projectPath, setProjectPath] = useState<string>('E:\\Code\\Pyra\\test-project')
  const [consoleMessages, setConsoleMessages] = useState<Array<{id: string, content: string, type: 'stdout' | 'stderr' | 'error' | 'info', timestamp: Date}>>([])
  const [showProjectPanel, setShowProjectPanel] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [ideSettings, setIdeSettings] = useState<IDESettings | null>(null)
  const [showVenvDialog, setShowVenvDialog] = useState(false)
  const [, setVenvExists] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const editorRef = useRef<EditorHandle | null>(null)
  const fileTreeRef = useRef<FileTreeHandle | null>(null)

  // Check if virtual environment exists when project loads
  useEffect(() => {
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

  const handleToggleProjectPanel = () => {
    console.log('Toggle project panel clicked, current state:', showProjectPanel)
    setShowProjectPanel(prev => {
      console.log('Setting showProjectPanel to:', !prev)
      return !prev
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

  const editorRun = () => editorRef.current?.run()
  const editorStop = () => editorRef.current?.stop()
  const editorFormat = () => editorRef.current?.format()
  const editorLint = () => editorRef.current?.lint()

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
    handleConsoleOutput(`📁 Project location: ${newProjectPath}`)
    
    // Auto-open the newly created project
    setProjectPath(newProjectPath)
    setCurrentFile(null) // Reset current file
    handleConsoleOutput(`🚀 Switched to project: ${projectName}`)
  }

  const handleOpenProject = async () => {
    try {
      const { TauriAPI } = await import('./lib/tauri')
      const selectedPath = await TauriAPI.openProjectDialog()
      
      if (selectedPath) {
        setProjectPath(selectedPath)
        setCurrentFile(null) // Reset current file
        const projectName = selectedPath.split('\\').pop() || selectedPath.split('/').pop()
        handleConsoleOutput(`📂 Opened project: ${projectName}`)
        handleConsoleOutput(`📁 Project location: ${selectedPath}`)
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
        <div className="flex items-center w-48 sm:w-56 md:w-64 px-2 gap-1 border-r no-drag" data-tauri-drag-region="false" style={{ borderColor: 'var(--ctp-surface1)' }}>
          <div className="flex items-center gap-2 px-2 py-1 rounded opacity-90" style={{ backgroundColor: 'var(--ctp-surface0)' }} data-tauri-drag-region="true">
            <span className="text-xs font-semibold select-none" style={{ color: 'var(--ctp-text)' }}>Pyra IDE</span>
            <img src="/pyra-icon.svg" alt="Pyra" className="h-4 w-4 select-none" />
          </div>
          <div className="flex items-center gap-1 ml-1">
            <button onClick={explorerNewFile} className="px-3 py-1 text-xs rounded font-medium transition-colors" style={{ backgroundColor: 'var(--ctp-yellow)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-peach)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-yellow)' }} type="button" title="New File">📄</button>
            <button onClick={explorerNewFolder} className="px-3 py-1 text-xs rounded font-medium transition-colors" style={{ backgroundColor: 'var(--ctp-sapphire)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-blue)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }} type="button" title="New Folder">📁</button>
            <button onClick={explorerRefresh} className="px-3 py-1 text-xs rounded font-medium transition-colors" style={{ backgroundColor: 'var(--ctp-teal)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sky)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-teal)' }} type="button" title="Refresh">🔄</button>
          </div>
        </div>

        {/* Center segment: editor actions */}
        <div className="flex-1 flex items-center px-2 gap-2 no-drag" data-tauri-drag-region="false">
          <button onClick={editorRun} disabled={!currentFile || !currentFile.endsWith('.py')} className="px-3 py-1 text-xs rounded font-medium transition-colors" style={{ backgroundColor: 'var(--ctp-green)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-teal)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-green)' }} type="button">{isMaximized ? '▶️ Run' : '▶️'}</button>
          <button onClick={editorStop} className="px-3 py-1 text-xs rounded font-medium transition-colors" style={{ backgroundColor: 'var(--ctp-red)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-maroon)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-red)' }} type="button">{isMaximized ? '⏹️ Stop' : '⏹️'}</button>
          <button onClick={editorFormat} disabled={!currentFile || !currentFile.endsWith('.py')} className="px-3 py-1 text-xs rounded font-medium transition-colors" style={{ backgroundColor: 'var(--ctp-blue)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-blue)' }} type="button">{isMaximized ? '🎨 Format' : '🎨'}</button>
          <button onClick={editorLint} disabled={!currentFile || !currentFile.endsWith('.py')} className="px-3 py-1 text-xs rounded font-medium transition-colors" style={{ backgroundColor: 'var(--ctp-mauve)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)' }} type="button">{isMaximized ? '🔍 Lint' : '🔍'}</button>
          {/* Right segment separator inside center area */}
          <div className="h-6 w-px mx-2" style={{ backgroundColor: 'var(--ctp-surface2)' }}></div>

          {/* Project actions + Settings on right */}
          <div className="ml-auto flex items-center gap-3 no-drag" data-tauri-drag-region="false">
          <button onClick={() => setShowTemplateDialog(true)} className="px-3 py-1 text-xs rounded font-medium transition-colors cursor-pointer select-none" style={{ backgroundColor: 'var(--ctp-green)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-teal)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-green)' }} type="button">{isMaximized ? '🚀 New Project' : '🚀'}</button>
          <button onClick={handleOpenProject} className="px-3 py-1 text-xs rounded font-medium transition-colors cursor-pointer select-none" style={{ backgroundColor: 'var(--ctp-blue)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-blue)' }} type="button">{isMaximized ? '📂 Open Project' : '📂'}</button>
          <button onClick={handleToggleProjectPanel} className="px-3 py-1 text-xs rounded font-medium transition-colors cursor-pointer select-none" style={{ backgroundColor: showProjectPanel ? 'var(--ctp-blue)' : 'var(--ctp-surface2)', color: showProjectPanel ? 'var(--ctp-base)' : 'var(--ctp-text)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = showProjectPanel ? 'var(--ctp-sapphire)' : 'var(--ctp-overlay0)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = showProjectPanel ? 'var(--ctp-blue)' : 'var(--ctp-surface2)' }} type="button">{isMaximized ? (showProjectPanel ? 'Hide Panel' : 'Show Panel') : '📋'}</button>
          <div className="text-xs" style={{ color: 'var(--ctp-overlay0)' }}>
            {currentFile ? (currentFile.split('\\').pop() || currentFile.split('/').pop()) : 'No file selected'}
          </div>
          <button onClick={handleOpenSettings} className="px-3 py-1 text-xs rounded font-medium transition-colors cursor-pointer select-none" style={{ backgroundColor: 'var(--ctp-mauve)', color: 'var(--ctp-base)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)' }} type="button">{isMaximized ? '⚙️ Settings' : '⚙️'}</button>

          {/* Window controls */}
          <div className="window-controls ml-2 flex items-center gap-1 no-drag" data-tauri-drag-region="false">
            <button
              onClick={minimizeWindow}
              className="px-2 py-1 text-xs rounded font-medium transition-colors no-drag"
              style={{ backgroundColor: 'var(--ctp-lavender)', color: 'var(--ctp-base)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)' }}
              type="button"
            >—</button>
            <button
              onClick={toggleMaximizeWindow}
              className="px-2 py-1 text-xs rounded font-medium transition-colors no-drag"
              style={{ backgroundColor: 'var(--ctp-sky)', color: 'var(--ctp-base)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-sky)' }}
              type="button"
            >▢</button>
            <button
              onClick={closeWindow}
              className="px-2 py-1 text-xs rounded font-medium transition-colors no-drag"
              style={{ backgroundColor: 'var(--ctp-red)', color: 'var(--ctp-base)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-maroon)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-red)' }}
              type="button"
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
            onFileSelect={setCurrentFile}
          />
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-h-0">
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
          <div className="h-32 md:h-40 lg:h-48 border-t min-h-[8rem] max-h-[50vh] flex-shrink-0" style={{ borderColor: 'var(--ctp-surface1)' }}>
            <Console projectPath={projectPath} messages={consoleMessages} onClearMessages={handleClearConsole} />
          </div>
        </div>

        {/* Project Panel */}
        {showProjectPanel && (
          <div className="w-80 bg-gray-900 border-l border-gray-700 flex-shrink-0">
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
        <StatusBar currentFile={currentFile} />
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
            <h3 className="text-xl font-bold text-white mb-4">🐍 Setup Python Environment</h3>
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
                🚀 Create Environment
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-700 rounded text-xs text-gray-400">
              💡 Tip: You can always create or manage virtual environments later from the Project Panel
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
