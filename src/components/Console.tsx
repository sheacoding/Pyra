import { useState, useRef, useEffect } from 'react'
import { TauriAPI } from '../lib/tauri'
import { ConsoleMessage } from '../types'

interface ConsoleProps {
  projectPath: string
  messages?: Array<{id: string, content: string, type: 'stdout' | 'stderr' | 'error' | 'info', timestamp: Date}>
  onClearMessages?: () => void
}

export function Console({ projectPath, messages: externalMessages, onClearMessages }: ConsoleProps) {
  const [localMessages, setLocalMessages] = useState<ConsoleMessage[]>([])
  const [input, setInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const consoleRef = useRef<HTMLDivElement>(null)

  // Combine external messages from script execution with local console messages
  const allMessages = [
    ...localMessages,
    ...(externalMessages || []).map(msg => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.timestamp,
      type: msg.type as ConsoleMessage['type']
    }))
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [allMessages])

  const addMessage = (content: string, type: ConsoleMessage['type'] = 'info') => {
    const message: ConsoleMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      type,
    }
    setLocalMessages(prev => [...prev, message])
  }

  const runScript = async (scriptPath: string) => {
    if (!projectPath || isRunning) return

    setIsRunning(true)
    addMessage(`Running: ${scriptPath}`, 'info')

    try {
      const output = await TauriAPI.runScript(projectPath, scriptPath)
      if (output.trim()) {
        addMessage(output, 'stdout')
      }
      addMessage('Script completed successfully', 'info')
    } catch (error) {
      addMessage(`Error: ${error}`, 'error')
    } finally {
      setIsRunning(false)
    }
  }

  const createVirtualEnv = async () => {
    if (!projectPath || isRunning) return

    setIsRunning(true)
    addMessage('Creating virtual environment...', 'info')

    try {
      const output = await TauriAPI.createVenv(projectPath)
      addMessage(output, 'stdout')
      addMessage('Virtual environment created successfully', 'info')
    } catch (error) {
      addMessage(`Failed to create virtual environment: ${error}`, 'error')
    } finally {
      setIsRunning(false)
    }
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isRunning) return

    const command = input.trim()
    addMessage(`> ${command}`, 'info')

    if (command === 'clear') {
      setLocalMessages([])
      onClearMessages?.()
    } else if (command === 'create-venv') {
      createVirtualEnv()
    } else if (command.startsWith('run ')) {
      const scriptPath = command.substring(4).trim()
      runScript(scriptPath)
    } else {
      addMessage(`Unknown command: ${command}`, 'error')
    }

    setInput('')
  }

  const getMessageColor = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'stdout': return 'text-green-400'
      case 'stderr': return 'text-red-400'
      case 'error': return 'text-red-400'
      case 'info': return 'text-blue-400'
      default: return 'text-gray-300'
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Console Header */}
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-300">Console</div>
        <div className="flex gap-2">
          <button
            onClick={createVirtualEnv}
            disabled={isRunning || !projectPath}
            className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded"
          >
            Create venv
          </button>
          <button
            onClick={() => {
              setLocalMessages([])
              onClearMessages?.()
            }}
            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Console Messages */}
      <div 
        ref={consoleRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
      >
        {allMessages.length === 0 ? (
          <div className="text-gray-500">
            Console ready. Type commands or use buttons above.
          </div>
        ) : (
          allMessages.map((message) => (
            <div
              key={message.id}
              className={`mb-1 ${getMessageColor(message.type)}`}
            >
              <span className="text-gray-500 mr-2">
                {message.timestamp.toLocaleTimeString()}
              </span>
              <span className="whitespace-pre-wrap">{message.content}</span>
            </div>
          ))
        )}
        {isRunning && (
          <div className="text-yellow-400 animate-pulse">
            Running command...
          </div>
        )}
      </div>

      {/* Console Input */}
      <div className="border-t border-gray-700 p-2">
        <form onSubmit={handleInputSubmit} className="flex">
          <span className="text-gray-400 mr-2 font-mono">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isRunning}
            placeholder="Enter command (e.g., 'run main.py', 'create-venv', 'clear')"
            className="flex-1 bg-transparent text-gray-300 font-mono text-sm focus:outline-none disabled:text-gray-500"
          />
        </form>
      </div>
    </div>
  )
}