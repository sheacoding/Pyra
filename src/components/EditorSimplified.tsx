import { useState, useEffect, useRef } from 'react'
import { Editor as MonacoEditor } from '@monaco-editor/react'
import { TauriAPI, RuffCheckResult, RuffDiagnostic } from '../lib/tauri'
import { listen } from '@tauri-apps/api/event'
import * as monaco from 'monaco-editor'
import { IDESettings } from './SettingsPanel'
import { catppuccin } from '../themes/catppuccin'

interface EditorProps {
  filePath: string | null
  projectPath: string
  settings?: IDESettings | null
}

export default function Editor({ filePath, projectPath, settings }: EditorProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [diagnostics, setDiagnostics] = useState<RuffDiagnostic[]>([])
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const markersRef = useRef<monaco.editor.IMarkerData[]>([])

  // Before editor mount - configure Monaco
  const handleBeforeMount = (monaco: any) => {
    // Define Catppuccin themes using vs-dark as base
    const mocha = catppuccin.mocha
    const latte = catppuccin.latte

    // Catppuccin Mocha (Dark)
    monaco.editor.defineTheme('catppuccin-mocha', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '7f849c', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'cba6f7' },
        { token: 'string', foreground: 'a6e3a1' },
        { token: 'number', foreground: 'fab387' },
        { token: 'regexp', foreground: 'f5c2e7' },
        { token: 'operator', foreground: '89dceb' },
        { token: 'namespace', foreground: 'f9e2af' },
        { token: 'type', foreground: 'f9e2af' },
        { token: 'struct', foreground: 'f9e2af' },
        { token: 'class', foreground: 'f9e2af' },
        { token: 'interface', foreground: 'f9e2af' },
        { token: 'enum', foreground: 'f9e2af' },
        { token: 'typeParameter', foreground: 'f5c2e7' },
        { token: 'function', foreground: '89b4fa' },
        { token: 'member', foreground: '89b4fa' },
        { token: 'macro', foreground: '94e2d5' },
        { token: 'variable', foreground: 'cdd6f4' },
        { token: 'parameter', foreground: 'f5c2e7' },
        { token: 'property', foreground: '89b4fa' },
        { token: 'label', foreground: '74c7ec' },
        { token: 'constant', foreground: 'fab387' },
        { token: 'decorator', foreground: 'f5c2e7' },
        { token: 'bracket', foreground: '9399b2' },
      ],
      colors: {
        'editor.background': '#1e1e2e',
        'editor.foreground': '#cdd6f4',
        'editorLineNumber.foreground': '#6c7086',
        'editorLineNumber.activeForeground': '#b4befe',
        'editor.selectionBackground': '#585b70',
        'editor.lineHighlightBackground': '#313244',
        'editorCursor.foreground': '#f5e0dc',
        'editorWhitespace.foreground': '#45475a',
        'editorIndentGuide.background': '#45475a',
        'editorIndentGuide.activeBackground': '#585b70',
      }
    })

    // Catppuccin Latte (Light)
    monaco.editor.defineTheme('catppuccin-latte', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8c8fa1', fontStyle: 'italic' },
        { token: 'keyword', foreground: '8839ef' },
        { token: 'string', foreground: '40a02b' },
        { token: 'number', foreground: 'fe640b' },
        { token: 'regexp', foreground: 'ea76cb' },
        { token: 'operator', foreground: '04a5e5' },
        { token: 'namespace', foreground: 'df8e1d' },
        { token: 'type', foreground: 'df8e1d' },
        { token: 'struct', foreground: 'df8e1d' },
        { token: 'class', foreground: 'df8e1d' },
        { token: 'interface', foreground: 'df8e1d' },
        { token: 'enum', foreground: 'df8e1d' },
        { token: 'typeParameter', foreground: 'ea76cb' },
        { token: 'function', foreground: '1e66f5' },
        { token: 'member', foreground: '1e66f5' },
        { token: 'macro', foreground: '179299' },
        { token: 'variable', foreground: '4c4f69' },
        { token: 'parameter', foreground: 'ea76cb' },
        { token: 'property', foreground: '1e66f5' },
        { token: 'label', foreground: '209fb5' },
        { token: 'constant', foreground: 'fe640b' },
        { token: 'decorator', foreground: 'ea76cb' },
        { token: 'bracket', foreground: '7c7f93' },
      ],
      colors: {
        'editor.background': '#eff1f5',
        'editor.foreground': '#4c4f69',
        'editorLineNumber.foreground': '#9ca0b0',
        'editorLineNumber.activeForeground': '#7287fd',
        'editor.selectionBackground': '#acb0be',
        'editor.lineHighlightBackground': '#e6e9ef',
        'editorCursor.foreground': '#dc8a78',
        'editorWhitespace.foreground': '#ccd0da',
        'editorIndentGuide.background': '#ccd0da',
        'editorIndentGuide.activeBackground': '#acb0be',
      }
    })
  }

  // Handle editor mount
  const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    console.log('✅ Editor mounted with Catppuccin themes')
  }

  // Load file content
  useEffect(() => {
    if (!filePath) {
      setContent('')
      return
    }

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

  // Ruff diagnostics integration
  useEffect(() => {
    if (!filePath || !filePath.endsWith('.py')) return

    const unlisten = listen<RuffCheckResult>('ruff-diagnostics', (event) => {
      if (event.payload.file === filePath) {
        setDiagnostics(event.payload.diagnostics || [])
      }
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [filePath])

  // Update Monaco markers from diagnostics
  useEffect(() => {
    if (!editorRef.current || !filePath) return

    const model = editorRef.current.getModel()
    if (!model) return

    const markers: monaco.editor.IMarkerData[] = diagnostics.map(diag => ({
      startLineNumber: diag.location.row,
      startColumn: diag.location.column,
      endLineNumber: diag.end_location.row,
      endColumn: diag.end_location.column,
      message: diag.message,
      severity: diag.code.startsWith('E')
        ? monaco.MarkerSeverity.Error
        : monaco.MarkerSeverity.Warning,
      source: `Ruff (${diag.code})`,
    }))

    markersRef.current = markers
    monaco.editor.setModelMarkers(model, 'ruff', markers)
  }, [diagnostics, filePath])

  // Handle content changes
  const handleContentChange = (value: string | undefined) => {
    if (value === undefined) return
    setContent(value)
  }

  // Save file
  const saveFile = async () => {
    if (!filePath || !editorRef.current) return

    try {
      const currentContent = editorRef.current.getValue()
      await TauriAPI.writeFile(filePath, currentContent)
      console.log('File saved successfully')
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }

  // Format file with Ruff
  const formatFile = async () => {
    if (!filePath || !filePath.endsWith('.py') || !editorRef.current) return

    try {
      const formatted = await TauriAPI.formatWithRuff(projectPath, filePath, content)
      if (formatted && formatted !== content) {
        const editor = editorRef.current
        const position = editor.getPosition()

        editor.setValue(formatted)

        if (position) {
          editor.setPosition(position)
          editor.revealPositionInCenter(position)
        }
      }
    } catch (error) {
      console.error('Failed to format file:', error)
    }
  }

  // Update theme when settings change
  useEffect(() => {
    if (!editorRef.current || !settings?.theme?.editorTheme) return

    const targetTheme = settings.theme.editorTheme
    monaco.editor.setTheme(targetTheme)
    console.log('Theme applied:', targetTheme)
  }, [settings?.theme?.editorTheme])

  if (!filePath) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <p className="text-gray-500">Select a file to edit</p>
      </div>
    )
  }

  const getLanguage = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'py': return 'python'
      case 'js': return 'javascript'
      case 'ts': return 'typescript'
      case 'tsx': return 'typescript'
      case 'jsx': return 'javascript'
      case 'json': return 'json'
      case 'html': return 'html'
      case 'css': return 'css'
      case 'md': return 'markdown'
      case 'yaml':
      case 'yml': return 'yaml'
      case 'toml': return 'toml'
      case 'rs': return 'rust'
      case 'go': return 'go'
      case 'cpp':
      case 'cc':
      case 'cxx': return 'cpp'
      case 'c': return 'c'
      case 'h':
      case 'hpp': return 'cpp'
      case 'java': return 'java'
      case 'sh':
      case 'bash': return 'shell'
      case 'ps1': return 'powershell'
      case 'xml': return 'xml'
      case 'sql': return 'sql'
      case 'r': return 'r'
      case 'lua': return 'lua'
      case 'vim': return 'vim'
      default: return 'plaintext'
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <MonacoEditor
          language={getLanguage(filePath)}
          value={content}
          onChange={handleContentChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          theme={settings?.theme?.editorTheme || "catppuccin-mocha"}
          options={{
            fontSize: settings?.editor?.fontSize || 14,
            fontFamily: settings?.editor?.fontFamily || 'JetBrains Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, monospace',
            minimap: { enabled: settings?.editor?.minimap || false },
            wordWrap: settings?.editor?.wordWrap ? 'on' : 'off',
            tabSize: settings?.editor?.tabSize || 4,
            insertSpaces: settings?.editor?.insertSpaces !== false,
            lineNumbers: settings?.editor?.lineNumbers ? 'on' : 'off',
            rulers: settings?.editor?.rulers || [],
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            formatOnPaste: settings?.editor?.formatOnPaste || false,
            formatOnType: settings?.editor?.formatOnType || false,
          }}
        />
      )}
    </div>
  )
}