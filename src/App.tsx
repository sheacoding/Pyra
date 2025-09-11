import { useState, useEffect } from 'react'
import { FileTree } from './components/FileTree'
import { Editor } from './components/Editor'
import { Console } from './components/Console'
import { StatusBar } from './components/StatusBar'

function App() {
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [projectPath] = useState<string>('E:\\Code\\Pyra\\test-project')
  const [consoleMessages, setConsoleMessages] = useState<Array<{id: string, content: string, type: 'stdout' | 'stderr' | 'error' | 'info', timestamp: Date}>>([])

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

  const handleClearConsole = () => {
    setConsoleMessages([])
  }

  useEffect(() => {
    // In a real app, this would be set by opening a project
    console.log('Pyra IDE initialized with project:', projectPath)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-4 flex-shrink-0">
        <div className="text-sm font-semibold text-purple-400">Pyra IDE</div>
        <div className="ml-auto text-xs text-gray-500">
          Project: {projectPath.split('\\').pop() || projectPath.split('/').pop()}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-48 sm:w-56 md:w-64 bg-gray-800 border-r border-gray-700 flex-shrink-0">
          <FileTree 
            projectPath={projectPath}
            onFileSelect={setCurrentFile}
          />
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <Editor 
              filePath={currentFile}
              projectPath={projectPath}
              onConsoleOutput={handleConsoleOutput}
              onConsoleError={handleConsoleError}
              onScriptStart={() => {}}
              onScriptStop={() => {}}
            />
          </div>
          
          {/* Console */}
          <div className="h-32 md:h-40 lg:h-48 border-t border-gray-700 min-h-[8rem] max-h-[50vh] flex-shrink-0">
            <Console projectPath={projectPath} messages={consoleMessages} onClearMessages={handleClearConsole} />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0">
        <StatusBar currentFile={currentFile} />
      </div>
    </div>
  )
}

export default App