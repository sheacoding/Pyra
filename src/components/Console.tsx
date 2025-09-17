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
      case 'stdout': return { color: 'var(--ctp-green)' }
      case 'stderr': return { color: 'var(--ctp-red)' }
      case 'error': return { color: 'var(--ctp-red)' }
      case 'info': return { color: 'var(--ctp-blue)' }
      default: return { color: 'var(--ctp-text)' }
    }
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--ctp-base)' }}>
      {/* Console Header */}
      <div className="px-4 py-2 border-b flex items-center justify-between"
           style={{ backgroundColor: 'var(--ctp-mantle)', borderColor: 'var(--ctp-surface1)' }}>
        <div className="text-sm font-semibold" style={{ color: 'var(--ctp-subtext1)' }}>Console</div>
        <div className="flex gap-2">
          <button
            onClick={createVirtualEnv}
            disabled={isRunning || !projectPath}
            className="px-2 py-1 text-xs rounded transition-colors disabled:opacity-50"
            style={{
              backgroundColor: isRunning || !projectPath ? 'var(--ctp-surface2)' : 'var(--ctp-mauve)',
              color: isRunning || !projectPath ? 'var(--ctp-subtext0)' : 'var(--ctp-base)'
            }}
            onMouseEnter={(e) => {
              if (!isRunning && projectPath) {
                e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isRunning && projectPath) {
                e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)'
              }
            }}
          >
            Create venv
          </button>
          <button
            onClick={() => {
              setLocalMessages([])
              onClearMessages?.()
            }}
            className="px-2 py-1 text-xs rounded transition-colors"
            style={{ backgroundColor: 'var(--ctp-surface2)', color: 'var(--ctp-text)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-overlay0)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-surface2)' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Console Messages */}
      <div
        ref={consoleRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
        style={{ backgroundColor: 'var(--ctp-base)' }}
      >
        {allMessages.length === 0 ? (
          <div style={{ color: 'var(--ctp-overlay0)' }}>
            Console ready. Type commands or use buttons above.
          </div>
        ) : (
          allMessages.map((message) => (
            <div
              key={message.id}
              className="mb-1"
              style={getMessageColor(message.type)}
            >
              <span className="mr-2" style={{ color: 'var(--ctp-overlay0)' }}>
                {message.timestamp.toLocaleTimeString()}
              </span>
              <span className="whitespace-pre-wrap">{message.content}</span>
            </div>
          ))
        )}
        {isRunning && (
          <div className="animate-pulse" style={{ color: 'var(--ctp-yellow)' }}>
            Running command...
          </div>
        )}
      </div>

      {/* Console Input */}
      <div className="border-t p-2" style={{ borderColor: 'var(--ctp-surface1)' }}>
        <form onSubmit={handleInputSubmit} className="flex">
          <span className="mr-2 font-mono" style={{ color: 'var(--ctp-overlay1)' }}>{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isRunning}
            placeholder="Enter command (e.g., 'run main.py', 'create-venv', 'clear')"
            className="flex-1 bg-transparent font-mono text-sm focus:outline-none disabled:opacity-50"
            style={{
              color: isRunning ? 'var(--ctp-overlay0)' : 'var(--ctp-text)',
              caretColor: 'var(--ctp-text)'
            }}
          />
        </form>
      </div>
    </div>
  )
}