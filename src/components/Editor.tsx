import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Editor as MonacoEditor } from '@monaco-editor/react'
import { TauriAPI, RuffCheckResult, RuffDiagnostic } from '../lib/tauri'
import { listen } from '@tauri-apps/api/event'
import type * as Monaco from 'monaco-editor'
import { IDESettings } from './SettingsPanel'
import { createMonacoCatppuccinTheme } from '../themes/monaco-catppuccin-fixed'

interface EditorProps {
  filePath: string | null
  projectPath: string
  settings?: IDESettings | null
  onConsoleOutput?: (output: string) => void
  onConsoleError?: (error: string) => void
  onScriptStart?: () => void
  onScriptStop?: () => void
}

export interface EditorHandle {
  run: () => void
  stop: () => void
  format: () => void
  lint: () => void
}

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor({ filePath, projectPath, settings, onConsoleOutput, onConsoleError, onScriptStart, onScriptStop }: EditorProps, ref) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [, setRuffDiagnostics] = useState<RuffDiagnostic[]>([])
  const [, setIsLinting] = useState(false)
  const [, setIsFormatting] = useState(false)
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<any>(null)

  // Define Catppuccin themes before the editor mounts
  const handleBeforeMount = (m: any) => {
    try {
      const mocha = createMonacoCatppuccinTheme('mocha')
      const latte = createMonacoCatppuccinTheme('latte')
      m.editor.defineTheme('catppuccin-mocha', mocha)
      m.editor.defineTheme('catppuccin-latte', latte)
      monacoRef.current = m
    } catch (error) {
      console.error('❌ Failed to define themes before mount:', error)
    }
  }

  // Debounce function for linting
  const debounceRef = useRef<number | null>(null)

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

  // Ruff linting functions
  const runRuffLinting = async (currentFilePath: string) => {
    if (!currentFilePath.endsWith('.py') || !projectPath) return

    console.log('🔍 Starting Ruff linting for:', currentFilePath)
    setIsLinting(true)
    try {
      const result: RuffCheckResult = await TauriAPI.ruffCheckFile(projectPath, currentFilePath)
      console.log('✅ Ruff linting result:', result)
      console.log('✅ Ruff diagnostics count:', result.diagnostics?.length || 0)
      
      if (result && result.diagnostics) {
        setRuffDiagnostics(result.diagnostics)
        updateEditorMarkers(result.diagnostics)
      } else {
        console.warn('⚠️ Ruff result structure unexpected:', result)
        setRuffDiagnostics([])
      }
    } catch (error) {
      console.error('❌ Ruff linting failed:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      setRuffDiagnostics([])
    } finally {
      setIsLinting(false)
    }
  }

  // Store decoration IDs to manage them
  const decorationIdsRef = useRef<string[]>([])

  // Helper function to get decoration styles based on severity
  const getSeverityStyles = (severity: string, m: any) => {
    const severityLower = severity.toLowerCase()
    
    if (severityLower.includes('error') || severityLower === 'e') {
      return {
        className: 'ruff-error-decoration',
        glyphMarginClassName: 'ruff-error-glyph',
        linesDecorationsClassName: 'ruff-error-line',
        overviewRulerColor: '#dc2626',
        minimapColor: '#dc2626',
        monacoSeverity: m?.MarkerSeverity?.Error ?? 8
      }
    } else if (severityLower.includes('warning') || severityLower.includes('warn') || severityLower === 'w') {
      return {
        className: 'ruff-warning-decoration',
        glyphMarginClassName: 'ruff-warning-glyph',
        linesDecorationsClassName: 'ruff-warning-line',
        overviewRulerColor: '#f59e0b',
        minimapColor: '#f59e0b',
        monacoSeverity: m?.MarkerSeverity?.Warning ?? 4
      }
    } else {
      // Default to info for everything else
      return {
        className: 'ruff-info-decoration',
        glyphMarginClassName: 'ruff-info-glyph',
        linesDecorationsClassName: 'ruff-info-line',
        overviewRulerColor: '#3b82f6',
        minimapColor: '#3b82f6',
        monacoSeverity: m?.MarkerSeverity?.Info ?? 2
      }
    }
  }

  const updateEditorMarkers = (diagnostics: RuffDiagnostic[]) => {
    console.log('🎯 Updating editor markers with diagnostics:', diagnostics)
    
    const m = monacoRef.current
    if (!editorRef.current || !m?.editor) {
      console.warn('❌ Editor or Monaco not available')
      return
    }

    const model = editorRef.current.getModel()
    if (!model) {
      console.warn('❌ Editor model not available')
      return
    }

    // Clear existing decorations
    if (decorationIdsRef.current.length > 0) {
      editorRef.current.deltaDecorations(decorationIdsRef.current, [])
      decorationIdsRef.current = []
      console.log('🧹 Cleared existing decorations')
    }

    // Clear existing markers
    m.editor.setModelMarkers(model, 'ruff', [])

    if (diagnostics.length === 0) {
      console.log('✅ No diagnostics to display')
      return
    }

    // Group diagnostics by severity for reporting
    const severityGroups = diagnostics.reduce((acc, diagnostic) => {
      const severity = diagnostic.severity.toLowerCase()
      if (severity.includes('error') || severity === 'e') {
        acc.errors++
      } else if (severity.includes('warning') || severity.includes('warn') || severity === 'w') {
        acc.warnings++
      } else {
        acc.info++
      }
      return acc
    }, { errors: 0, warnings: 0, info: 0 })

    console.log(`📊 Diagnostics breakdown: ${severityGroups.errors} errors, ${severityGroups.warnings} warnings, ${severityGroups.info} info`)

    // Create decorations with severity-based styling
    const decorations = diagnostics.map((diagnostic) => {
      const styles = getSeverityStyles(diagnostic.severity, m)
      
      return {
        range: new m.Range(
          Math.max(1, diagnostic.line),
          Math.max(1, diagnostic.column),
          Math.max(1, diagnostic.end_line),
          Math.max(1, diagnostic.end_column)
        ),
        options: {
          className: styles.className,
          hoverMessage: { 
            value: `**${diagnostic.severity.toUpperCase()} - ${diagnostic.rule}**: ${diagnostic.message}` 
          },
          glyphMarginClassName: styles.glyphMarginClassName,
          linesDecorationsClassName: styles.linesDecorationsClassName,
          overviewRuler: {
            color: styles.overviewRulerColor,
            position: m.OverviewRulerLane?.Right ?? 1
          },
          minimap: {
            color: styles.minimapColor,
            position: m.MinimapPosition?.Inline ?? 1
          },
          stickiness: m.TrackedRangeStickiness?.NeverGrowsWhenTypingAtEdges ?? 1
        }
      }
    })

    // Apply decorations and store their IDs
    decorationIdsRef.current = editorRef.current.deltaDecorations([], decorations)
    console.log(`✅ Applied ${decorations.length} decorations with severity-based styling`)

    // Create traditional markers with proper severity mapping
    const markers = diagnostics.map((diagnostic) => {
      const styles = getSeverityStyles(diagnostic.severity, m)
      
      return {
        startLineNumber: Math.max(1, diagnostic.line),
        startColumn: Math.max(1, diagnostic.column),
        endLineNumber: Math.max(1, diagnostic.end_line),
        endColumn: Math.max(1, diagnostic.end_column),
        message: `${diagnostic.rule}: ${diagnostic.message}`,
        severity: styles.monacoSeverity,
        source: 'Ruff'
      }
    })

    m.editor.setModelMarkers(model, 'ruff', markers)
    console.log(`📍 Set ${markers.length} traditional markers with severity mapping`)
    
    // Force editor to refresh
    editorRef.current.layout()
    
    // Reveal the first error (prioritize errors, then warnings, then info)
    const firstError = diagnostics.find(d => d.severity.toLowerCase().includes('error') || d.severity.toLowerCase() === 'e')
    const firstWarning = diagnostics.find(d => d.severity.toLowerCase().includes('warning') || d.severity.toLowerCase().includes('warn') || d.severity.toLowerCase() === 'w')
    const firstDiagnostic = firstError || firstWarning || diagnostics[0]
    
    if (firstDiagnostic && decorations.length > 0) {
      editorRef.current.revealLineInCenter(firstDiagnostic.line)
      console.log(`🎯 Revealed line ${firstDiagnostic.line} (${firstDiagnostic.severity}: ${firstDiagnostic.rule})`)
    }
  }

  // Debounce function for linting with different delays for different types
  const quickDebounceRef = useRef<number | null>(null)

  // Quick syntax check for immediate feedback (shorter delay)
  const quickSyntaxCheck = (currentFilePath: string) => {
    if (!currentFilePath.endsWith('.py') || !projectPath) return

    if (quickDebounceRef.current) {
      clearTimeout(quickDebounceRef.current)
    }
    
    quickDebounceRef.current = setTimeout(() => {
      console.log('🚀 Running quick syntax check for:', currentFilePath)
      runRuffLinting(currentFilePath)
    }, 300) // 300ms delay for quick feedback
  }

  // Standard linting (longer delay)
  const debouncedLint = (currentFilePath: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      console.log('🔍 Running full lint check for:', currentFilePath)
      runRuffLinting(currentFilePath)
    }, 1000) // 1 second delay for full analysis
  }

  const formatWithRuff = async () => {
    if (!filePath || !filePath.endsWith('.py') || !projectPath) {
      console.log('❌ Format skipped - invalid conditions:', { filePath, projectPath })
      return
    }

    setIsFormatting(true)
    onConsoleOutput?.('🔧 Formatting with Ruff...\n')
    console.log('🎨 Starting Ruff format for:', filePath)
    
    try {
      const result = await TauriAPI.ruffFormatFile(projectPath, filePath)
      console.log('✅ Ruff format result:', result)
      
      // Reload the file to show formatted content
      const fileContent = await TauriAPI.readFile(filePath)
      console.log('📄 Reloaded file content length:', fileContent.length)
      
      setContent(fileContent)
      if (editorRef.current) {
        editorRef.current.setValue(fileContent)
        console.log('✅ Editor content updated after formatting')
        onConsoleOutput?.('✅ File formatted successfully\n')
      } else {
        console.warn('❌ Editor ref not available for content update')
        onConsoleOutput?.('⚠️ File formatted but editor display may not be updated\n')
      }
    } catch (error) {
      console.error('❌ Ruff formatting failed:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      onConsoleError?.(`❌ Ruff formatting failed: ${error}\n`)
    } finally {
      setIsFormatting(false)
    }
  }

  // Alias for formatWithRuff to make the code cleaner
  const formatCurrentFile = formatWithRuff

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
      // Check if this is a UV project by looking for pyproject.toml
      const pyprojectExists = await TauriAPI.fileExists(`${projectPath}/pyproject.toml`)
      
      if (pyprojectExists) {
        // Try to use UV run with streaming for UV projects
        onConsoleOutput?.('Using UV to execute script with streaming...\n')
        try {
          console.log('Calling runScriptWithUvStreaming...')
          await TauriAPI.runScriptWithUvStreaming(projectPath, filePath)
          console.log('runScriptWithUvStreaming returned')
          // isRunning will be set to false when 'script-completed' event is received
          return
        } catch (uvError) {
          // UV run failed, fall back to streaming execution
          onConsoleOutput?.('UV streaming run failed, falling back to traditional execution...\n')
          console.log('UV streaming run failed, falling back:', uvError)
        }
      }
      
      // Fall back to streaming execution (original method)
      console.log('Calling runScriptWithStreaming...')
      // This now returns immediately, the process runs in background
      await TauriAPI.runScriptWithStreaming(projectPath, filePath)
      console.log('runScriptWithStreaming returned')
      // isRunning will be set to false when 'script-completed' event is received
    } catch (error) {
      console.error('Error in script execution:', error)
      onConsoleError?.(`Error: ${error}\n`)
      setIsRunning(false)
      onScriptStop?.()
    }
  }

  const stopRunning = () => {
    if (!isRunning) return
    TauriAPI.stopRunningScript()
      .then(() => {
        setIsRunning(false)
        onScriptStop?.()
      })
      .catch(() => {
        setIsRunning(false)
        onScriptStop?.()
      })
  }

  useEffect(() => {
    if (!filePath) return

    const loadFile = async () => {
      setLoading(true)
      try {
        const fileContent = await TauriAPI.readFile(filePath)
        setContent(fileContent)
        // Run initial linting after file loads
        if (filePath.endsWith('.py')) {
          setTimeout(() => runRuffLinting(filePath), 500)
        }
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
      
      if (filePath.endsWith('.py')) {
        // Always run quick syntax check for immediate feedback
        quickSyntaxCheck(filePath)
        
        // Also run full linting if enabled in settings
        if (settings?.ruff?.lintOnSave) {
          debouncedLint(filePath)
        }
      }
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }

  // Handle editor mount to store reference and add keybindings
  const handleEditorMount = (editor: Monaco.editor.IStandaloneCodeEditor, m: any) => {
    editorRef.current = editor
    monacoRef.current = m || monacoRef.current

    console.log('🎨 Monaco Editor mounted')

    try {
      // Apply the current theme
      const targetTheme = settings?.theme?.editorTheme || 'catppuccin-mocha'
      console.log('🎯 Applying theme:', targetTheme)
      monacoRef.current?.editor?.setTheme(targetTheme)

      // Debug: Check what tokens are actually generated
      if (filePath?.endsWith('.py')) {
        const model = editor.getModel()
        if (model) {
          const content = model.getValue()
          const tokens = monacoRef.current?.editor?.tokenize(content.substring(0, 500), 'python')
          console.log('🔍 Python tokens for current file:', tokens)
        }
      }

    } catch (error) {
      console.error('❌ Failed to apply theme on mount:', error)
    }
    
    // Add keybindings
    editor.addCommand(monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyMod.Shift | monacoRef.current.KeyCode.KeyF, () => {
      if (filePath?.endsWith('.py')) {
        formatCurrentFile()
      }
    })
    
    // Add keybinding for save and format (Ctrl+S)
    editor.addCommand(monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.KeyS, async () => {
      if (!filePath) return
      
      try {
        const currentContent = editor.getValue()
        await TauriAPI.writeFile(filePath, currentContent)
        
        // Auto-format on save for Python files if enabled in settings
        if (filePath.endsWith('.py') && settings?.ruff?.formatOnSave) {
          await formatCurrentFile()
        }
      } catch (error) {
        console.error('Failed to save file:', error)
      }
    })
  }

  // Update theme when settings change
  useEffect(() => {
    if (!editorRef.current || !settings?.theme?.editorTheme) return

    const targetTheme = settings.theme.editorTheme
    console.log('🔄 Settings changed - applying theme:', targetTheme)

    try {
      // Register custom themes if needed
      if (targetTheme.startsWith('catppuccin')) {
        const mochaTheme = createMonacoCatppuccinTheme('mocha')
        const latteTheme = createMonacoCatppuccinTheme('latte')
        const m = monacoRef.current
        m?.editor?.defineTheme('catppuccin-mocha', mochaTheme)
        m?.editor?.defineTheme('catppuccin-latte', latteTheme)
      }

      // Apply the theme
      monacoRef.current?.editor?.setTheme(targetTheme)
      console.log('✅ Theme applied:', targetTheme)

      // Set data-theme attributes for CSS
      document.documentElement.setAttribute('data-theme', targetTheme)
      document.body.setAttribute('data-theme', targetTheme)

      // Force layout refresh
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.layout()
          // Trigger re-tokenization for better highlighting
          const model = editorRef.current.getModel()
          if (model) {
            editorRef.current.trigger('editor', 'editor.action.formatDocument', {})
          }
          console.log('✅ Layout and tokenization refreshed')
        }
      }, 50)

    } catch (error) {
      console.error('❌ Failed to apply theme:', error)
    }
  }, [settings?.theme?.editorTheme])

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

  useImperativeHandle(ref, () => ({
    run: () => { runCurrentFile() },
    stop: () => { stopRunning() },
    format: () => { formatCurrentFile() },
    lint: () => { if (filePath) runRuffLinting(filePath) }
  }), [filePath, projectPath, isRunning, settings])

  if (!filePath) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--ctp-overlay0)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🐍</div>
          <div className="text-xl mb-2" style={{ color: 'var(--ctp-text)' }}>Welcome to Pyra IDE</div>
          <div className="text-sm" style={{ color: 'var(--ctp-subtext1)' }}>Open a file to start editing</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--ctp-overlay0)' }}>
        Loading...
      </div>
    )
  }

  // Get the current theme colors for forcing background
  const getCurrentThemeColors = () => {
    const currentTheme = settings?.theme?.editorTheme || "catppuccin-mocha"
    if (currentTheme === 'catppuccin-mocha') {
      return { background: '#1e1e2e', foreground: '#cdd6f4' }
    } else if (currentTheme === 'catppuccin-latte') {
      return { background: '#eff1f5', foreground: '#4c4f69' }
    }
    return { background: '#1e1e2e', foreground: '#cdd6f4' } // default to mocha
  }

  return (
    <div className="h-full flex flex-col">
      {/* Global toolbar moved to App.tsx */}
      
      {/* Monaco Editor */}
      <div 
        className="flex-1"
        style={{ 
          backgroundColor: getCurrentThemeColors().background,
          color: getCurrentThemeColors().foreground 
        }}
      >
        <MonacoEditor
          height="100%"
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
            lineNumbers: settings?.editor?.lineNumbers ? 'on' : 'off',
            folding: true,
            wordWrap: settings?.editor?.wordWrap ? 'on' : 'off',
            automaticLayout: true,
            tabSize: settings?.editor?.tabSize || 4,
            insertSpaces: settings?.editor?.insertSpaces ?? true,
            renderWhitespace: settings?.editor?.renderWhitespace ? 'all' : 'selection',
            scrollBeyondLastLine: false,
            // Enable hover for markers
            hover: {
              enabled: true,
              sticky: true
            },
            // Enable the problems widget
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            }
          }}
        />
      </div>
    </div>
  )
})
