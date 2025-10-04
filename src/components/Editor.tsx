import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
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
  getContent: () => string
  getBreakpoints: () => number[]
}

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor({ filePath, projectPath, settings, onConsoleOutput, onConsoleError, onScriptStart, onScriptStop }: EditorProps, ref) {
  const { t } = useTranslation()
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [, setRuffDiagnostics] = useState<RuffDiagnostic[]>([])
  const [, setIsLinting] = useState(false)
  const [, setIsFormatting] = useState(false)
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set())
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<any>(null)
  const breakpointDecorationsRef = useRef<string[]>([])

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

    console.log('[LINT] Starting Ruff linting for:', currentFilePath)
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

  // Update breakpoint decorations
  const updateBreakpointDecorations = () => {
    if (!editorRef.current || !monacoRef.current) return

    const decorations = Array.from(breakpoints).map(lineNumber => ({
      range: new monacoRef.current.Range(lineNumber, 1, lineNumber, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'breakpoint-glyph',
        glyphMarginHoverMessage: { value: t('editor.breakpoint.toggle') }
      }
    }))

    breakpointDecorationsRef.current = editorRef.current.deltaDecorations(
      breakpointDecorationsRef.current,
      decorations
    )
  }

  // Toggle breakpoint at a specific line
  const toggleBreakpoint = (lineNumber: number) => {
    setBreakpoints(prev => {
      const newBreakpoints = new Set(prev)
      if (newBreakpoints.has(lineNumber)) {
        newBreakpoints.delete(lineNumber)
        onConsoleOutput?.(t('messages.breakpointRemoved', { line: lineNumber }) + '\n')
      } else {
        newBreakpoints.add(lineNumber)
        onConsoleOutput?.(t('messages.breakpointAdded', { line: lineNumber }) + '\n')
      }
      return newBreakpoints
    })
  }

  // Update breakpoint decorations when breakpoints change
  useEffect(() => {
    updateBreakpointDecorations()
  }, [breakpoints])

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
    console.log('[LINT] Updating editor markers with diagnostics:', diagnostics)
    
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
      console.log('[LINT] Cleared existing decorations')
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

    console.log(`[LINT] Diagnostics breakdown: ${severityGroups.errors} errors, ${severityGroups.warnings} warnings, ${severityGroups.info} info`)

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
    console.log(`[LINT] Set ${markers.length} traditional markers with severity mapping`)
    
    // Force editor to refresh
    editorRef.current.layout()
    
    // Reveal the first error (prioritize errors, then warnings, then info)
    const firstError = diagnostics.find(d => d.severity.toLowerCase().includes('error') || d.severity.toLowerCase() === 'e')
    const firstWarning = diagnostics.find(d => d.severity.toLowerCase().includes('warning') || d.severity.toLowerCase().includes('warn') || d.severity.toLowerCase() === 'w')
    const firstDiagnostic = firstError || firstWarning || diagnostics[0]
    
    if (firstDiagnostic && decorations.length > 0) {
      editorRef.current.revealLineInCenter(firstDiagnostic.line)
      console.log(`[LINT] Revealed line ${firstDiagnostic.line} (${firstDiagnostic.severity}: ${firstDiagnostic.rule})`)
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
      console.log('[LINT] Running quick syntax check for:', currentFilePath)
      runRuffLinting(currentFilePath)
    }, 300) // 300ms delay for quick feedback
  }

  // Standard linting (longer delay)
  const debouncedLint = (currentFilePath: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      console.log('[LINT] Running full lint check for:', currentFilePath)
      runRuffLinting(currentFilePath)
    }, 1000) // 1 second delay for full analysis
  }

  const formatWithRuff = async () => {
    if (!filePath || !filePath.endsWith('.py') || !projectPath) {
      console.log('❌ Format skipped - invalid conditions:', { filePath, projectPath })
      return
    }

    setIsFormatting(true)
    onConsoleOutput?.(`${t('messages.ruffFormatting')}\n`)
    console.log('[FORMAT] Starting Ruff format for:', filePath)
    
    try {
      const result = await TauriAPI.ruffFormatFile(projectPath, filePath)
      console.log('✅ Ruff format result:', result)
      
      // Reload the file to show formatted content
      const fileContent = await TauriAPI.readFile(filePath)
      console.log('[EDITOR] Reloaded file content length:', fileContent.length)
      
      setContent(fileContent)
      if (editorRef.current) {
        editorRef.current.setValue(fileContent)
        console.log('✅ Editor content updated after formatting')
        onConsoleOutput?.(`${t('messages.ruffFormatSuccess')}\n`)
      } else {
        console.warn('❌ Editor ref not available for content update')
        onConsoleOutput?.(`${t('messages.ruffFormatWarning')}\n`)
      }
    } catch (error) {
      console.error('❌ Ruff formatting failed:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      onConsoleError?.(`${t('messages.ruffFormatFailed', { error: String(error) })}\n`)
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
      onConsoleError?.(`${t('messages.pythonFileOnly')}\n`)
      return
    }

    console.log('Starting script execution, setting isRunning to true')
    setIsRunning(true)
    onConsoleOutput?.(`${t('messages.runningScript', { path: filePath })}\n`)
    onScriptStart?.()
    
    try {
      // Check if this is a UV project by looking for pyproject.toml
      const pyprojectExists = await TauriAPI.fileExists(`${projectPath}/pyproject.toml`)
      
      if (pyprojectExists) {
        // Try to use UV run with streaming for UV projects
        onConsoleOutput?.(`${t('messages.usingUvStreaming')}\n`)
        try {
          console.log('Calling runScriptWithUvStreaming...')
          await TauriAPI.runScriptWithUvStreaming(projectPath, filePath)
          console.log('runScriptWithUvStreaming returned')
          // isRunning will be set to false when 'script-completed' event is received
          return
        } catch (uvError) {
          // UV run failed, fall back to streaming execution
          onConsoleOutput?.(`${t('messages.uvFallback')}\n`)
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
      onConsoleError?.(`${t('messages.scriptError', { error: String(error) })}\n`)
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
        // Run initial linting after file loads (dev only to avoid popup in release)
        if (filePath.endsWith('.py') && import.meta.env.DEV) {
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

    console.log('[EDITOR] Monaco Editor mounted')

    try {
      // Register themes first
      const mochaTheme = createMonacoCatppuccinTheme('mocha')
      const latteTheme = createMonacoCatppuccinTheme('latte')
      if (m?.editor) {
        m.editor.defineTheme('catppuccin-mocha', mochaTheme)
        m.editor.defineTheme('catppuccin-latte', latteTheme)
        console.log('✅ Themes registered on mount')
      }

      // Apply the current theme
      const targetTheme = settings?.theme?.editorTheme || 'catppuccin-mocha'
      console.log('[EDITOR] Applying initial theme on mount:', targetTheme)
      monacoRef.current?.editor?.setTheme(targetTheme)

      // Force editor container background
      const editorContainer = editor.getContainerDomNode()
      if (editorContainer) {
        const uiTheme = settings?.theme?.uiTheme || 'catppuccin-mocha'
        const backgroundColor = uiTheme === 'catppuccin-latte' ? '#eff1f5' : '#1e1e2e'
        editorContainer.style.backgroundColor = backgroundColor

        // Also force the Monaco editor div background
        const monacoDiv = editorContainer.querySelector('.monaco-editor')
        if (monacoDiv instanceof HTMLElement) {
          monacoDiv.style.backgroundColor = backgroundColor
        }

        console.log('✅ Initial editor container background set to:', backgroundColor)
      }

      // Debug: Check what tokens are actually generated
      if (filePath?.endsWith('.py')) {
        const model = editor.getModel()
        if (model) {
          const content = model.getValue()
          const tokens = monacoRef.current?.editor?.tokenize(content.substring(0, 500), 'python')
          console.log('[EDITOR] Python tokens for current file:', tokens)
        }
      }

    } catch (error) {
      console.error('❌ Failed to apply theme on mount:', error)
    }

    // Add click handler for breakpoints in glyph margin
    editor.onMouseDown((e) => {
      // Check if click was in the glyph margin (line number area)
      if (e.target.type === m.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        if (e.target.position) {
          toggleBreakpoint(e.target.position.lineNumber)
        }
      }
    })

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
    if (!editorRef.current || !monacoRef.current) return

    const targetTheme = settings?.theme?.editorTheme || 'catppuccin-mocha'
    const uiTheme = settings?.theme?.uiTheme || 'catppuccin-mocha'
    console.log('[EDITOR] Settings changed - applying theme:', targetTheme, 'UI theme:', uiTheme)

    try {
      // Always register custom themes to ensure they're available
      const mochaTheme = createMonacoCatppuccinTheme('mocha')
      const latteTheme = createMonacoCatppuccinTheme('latte')
      const m = monacoRef.current
      if (m?.editor) {
        m.editor.defineTheme('catppuccin-mocha', mochaTheme)
        m.editor.defineTheme('catppuccin-latte', latteTheme)
        console.log('✅ Themes registered in Monaco')
      }

      // Apply the theme to Monaco editor
      monacoRef.current?.editor?.setTheme(targetTheme)
      console.log('✅ Monaco theme applied:', targetTheme)

      // Force editor wrapper background to match theme
      const editorContainer = editorRef.current.getContainerDomNode()
      if (editorContainer) {
        const backgroundColor = uiTheme === 'catppuccin-latte' ? '#eff1f5' : '#1e1e2e'
        editorContainer.style.backgroundColor = backgroundColor

        // Also force the Monaco editor div background
        const monacoDiv = editorContainer.querySelector('.monaco-editor')
        if (monacoDiv instanceof HTMLElement) {
          monacoDiv.style.backgroundColor = backgroundColor + ' !important'
        }

        console.log('✅ Editor container background forced to:', backgroundColor)
      }

      // Force layout refresh with delay to ensure theme is applied
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.layout()
          console.log('✅ Layout refreshed')

          // Force re-render by briefly setting a different theme then back
          if (targetTheme === 'catppuccin-latte') {
            monacoRef.current?.editor?.setTheme('catppuccin-mocha')
            setTimeout(() => {
              monacoRef.current?.editor?.setTheme('catppuccin-latte')
              console.log('✅ Theme double-applied for Latte')
            }, 50)
          } else {
            monacoRef.current?.editor?.setTheme('catppuccin-latte')
            setTimeout(() => {
              monacoRef.current?.editor?.setTheme('catppuccin-mocha')
              console.log('✅ Theme double-applied for Mocha')
            }, 50)
          }
        }
      }, 100)

    } catch (error) {
      console.error('❌ Failed to apply theme:', error)
    }
  }, [settings?.theme?.editorTheme, settings?.theme?.uiTheme])

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
    lint: () => { if (filePath) runRuffLinting(filePath) },
    getContent: () => { return editorRef.current?.getValue() || content },
    getBreakpoints: () => { return Array.from(breakpoints) }
  }), [filePath, projectPath, isRunning, settings, content, breakpoints])

  if (!filePath) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--ctp-overlay0)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4"><i className="fab fa-python text-blue-500"></i></div>
          <div className="text-xl mb-2" style={{ color: 'var(--ctp-text)' }}>Welcome to Pyra IDE</div>
          <div className="text-sm" style={{ color: 'var(--ctp-subtext1)' }}>Open a file to start editing</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--ctp-overlay0)' }}>
        {t('editor.loading')}
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
            lineNumbers: settings?.editor?.lineNumbers !== false ? 'on' : 'off',
            folding: true,
            wordWrap: settings?.editor?.wordWrap ? 'on' : 'off',
            automaticLayout: true,
            tabSize: settings?.editor?.tabSize || 4,
            insertSpaces: settings?.editor?.insertSpaces ?? true,
            renderWhitespace: settings?.editor?.renderWhitespace ? 'all' : 'selection',
            scrollBeyondLastLine: false,
            // Line number styling
            lineNumbersMinChars: 3,
            glyphMargin: true,
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
            },
            // Better visual experience
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            // Theme-related settings
            bracketPairColorization: {
              enabled: true
            },
            guides: {
              bracketPairs: true,
              indentation: true
            }
          }}
        />
      </div>
    </div>
  )
})
