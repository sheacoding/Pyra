import { useState, useEffect } from 'react'
import { Editor as MonacoEditor } from '@monaco-editor/react'
import { TauriAPI } from '../lib/tauri'
import { listen } from '@tauri-apps/api/event'

interface EditorProps {
  filePath: string | null
  projectPath: string
  onConsoleOutput?: (output: string) => void
  onConsoleError?: (error: string) => void
  onScriptStart?: () => void
  onScriptStop?: () => void
}

export function Editor({ filePath, projectPath, onConsoleOutput, onConsoleError, onScriptStart, onScriptStop }: EditorProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    // Setup event listeners for script output
    const unlistenOutput = listen('script-output', (event) => {
      onConsoleOutput?.(event.payload as string)
    })
    
    const unlistenError = listen('script-error', (event) => {
      onConsoleError?.(event.payload as string)
    })

    const unlistenCompleted = listen('script-completed', () => {
      console.log('script-completed event received, setting isRunning to false')
      setIsRunning(false)
      onScriptStop?.()
    })

    return () => {
      unlistenOutput.then(f => f())
      unlistenError.then(f => f())
      unlistenCompleted.then(f => f())
    }
  }, [onConsoleOutput, onConsoleError, onScriptStop])

  const runCurrentFile = async () => {
    if (!filePath || !projectPath || isRunning) return
    
    // Only run Python files
    if (!filePath.endsWith('.py')) {
      onConsoleError?.('Can only run Python (.py) files\n')
      return
    }

    console.log('Starting script execution, setting isRunning to true')
    setIsRunning(true)
    onConsoleOutput?.(`Running ${filePath}...\n`)
    onScriptStart?.()
    
    try {
      console.log('Calling runScriptWithStreaming...')
      // This now returns immediately, the process runs in background
      await TauriAPI.runScriptWithStreaming(projectPath, filePath)
      console.log('runScriptWithStreaming returned')
      // isRunning will be set to false when 'script-completed' event is received
    } catch (error) {
      console.error('Error in runScriptWithStreaming:', error)
      onConsoleError?.(`Error: ${error}\n`)
      setIsRunning(false)
      onScriptStop?.()
    }
  }

  useEffect(() => {
    if (!filePath) return

    const loadFile = async () => {
      setLoading(true)
      try {
        const fileContent = await TauriAPI.readFile(filePath)
        setContent(fileContent)
      } catch (error) {
        console.error('Failed to load file:', error)
        setContent('')
      } finally {
        setLoading(false)
      }
    }

    loadFile()
  }, [filePath])

  const handleContentChange = async (value: string | undefined) => {
    if (!value || !filePath) return
    
    setContent(value)
    
    // Auto-save after a delay
    try {
      await TauriAPI.writeFile(filePath, value)
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }

  const getLanguage = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'py': return 'python'
      case 'js': return 'javascript'
      case 'ts': return 'typescript'
      case 'json': return 'json'
      case 'md': return 'markdown'
      case 'html': return 'html'
      case 'css': return 'css'
      default: return 'plaintext'
    }
  }

  if (!filePath) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">🐍</div>
          <div className="text-xl mb-2">Welcome to Pyra IDE</div>
          <div className="text-sm">Open a file to start editing</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Loading...
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      {filePath && filePath.endsWith('.py') && (
        <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-2">
          <button
            onClick={runCurrentFile}
            disabled={isRunning}
            className={`px-3 py-1 text-sm rounded flex items-center gap-2 ${
              isRunning 
                ? 'bg-yellow-600 text-white cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRunning ? '⏳' : '▶️'} 
            {isRunning ? 'Running...' : 'Run'}
          </button>
          {isRunning && (
            <button
              onClick={() => {
                console.log('Stop button clicked, current isRunning:', isRunning)
                // Use a non-async function to ensure immediate response
                TauriAPI.stopRunningScript()
                  .then(() => {
                    console.log('Stop script successful, setting isRunning to false')
                    setIsRunning(false)
                    onScriptStop?.()
                  })
                  .catch((error) => {
                    console.error('Failed to stop script:', error)
                    // Still set to false even if stop failed
                    setIsRunning(false)
                    onScriptStop?.()
                  })
              }}
              className="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-700 text-white"
            >
              ⏹️ Stop
            </button>
          )}
          <div className="text-xs text-gray-400">
            {filePath.split('\\').pop() || filePath.split('/').pop()}
          </div>
        </div>
      )}
      
      {/* Monaco Editor */}
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={getLanguage(filePath)}
          value={content}
          onChange={handleContentChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, monospace',
            minimap: { enabled: false },
            lineNumbers: 'on',
            folding: true,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            renderWhitespace: 'selection',
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  )
}