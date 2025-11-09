import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { listen } from '@tauri-apps/api/event'
import { TauriAPI, type StackFrame, type Variable, type Scope } from '../lib/tauri'

interface DebugPanelProps {
  isVisible: boolean
  onClose: () => void
}

type DebugState = 'idle' | 'running' | 'paused'

export function DebugPanel({ isVisible, onClose }: DebugPanelProps) {
  const { t } = useTranslation()
  const [isPaused, setIsPaused] = useState(false)
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null)
  const [debugState, setDebugState] = useState<DebugState>('idle')
  const [stackFrames, setStackFrames] = useState<StackFrame[]>([])
  const [selectedFrameId, setSelectedFrameId] = useState<number | null>(null)
  const [scopes, setScopes] = useState<Scope[]>([])
  const [selectedScopeRef, setSelectedScopeRef] = useState<number | null>(null)
  const [variables, setVariables] = useState<Variable[]>([])
  const [expandedVars, setExpandedVars] = useState<Set<number>>(new Set())
  const [variableChildren, setVariableChildren] = useState<Map<number, Variable[]>>(new Map())
  const [loadingChildRefs, setLoadingChildRefs] = useState<Set<number>>(new Set())
  const [isScopeLoading, setIsScopeLoading] = useState(false)

  // Determine initial debug state when panel becomes visible
  useEffect(() => {
    if (isVisible) {
      if (isPaused && currentThreadId !== null) {
        setDebugState('paused')
      } else if (currentThreadId !== null) {
        setDebugState('running')
      } else {
        setDebugState('idle')
      }
    }
  }, [isVisible, isPaused, currentThreadId])

  const resetVariableTree = useCallback(() => {
    setVariables([])
    setExpandedVars(new Set())
    setVariableChildren(new Map())
    setLoadingChildRefs(new Set())
    setSelectedScopeRef(null)
    setIsScopeLoading(false)
  }, [])

  const loadScopeVariables = useCallback(async (scope: Scope) => {
    try {
      setIsScopeLoading(true)
      setSelectedScopeRef(scope.variables_reference)
      const vars = await TauriAPI.getVariables(scope.variables_reference)
      setVariables(vars)
      setExpandedVars(new Set())
      setVariableChildren(new Map())
      setLoadingChildRefs(new Set())
    } catch (error) {
      console.error('Failed to get scope variables:', error)
      setVariables([])
    } finally {
      setIsScopeLoading(false)
    }
  }, [])

  const loadFrameData = useCallback(async (frameId: number) => {
    try {
      const frameScopes = await TauriAPI.getScopes(frameId)
      setScopes(frameScopes)

      if (frameScopes.length > 0) {
        await loadScopeVariables(frameScopes[0])
      } else {
        resetVariableTree()
      }
    } catch (error) {
      console.error('Failed to get frame info:', error)
      setScopes([])
      resetVariableTree()
    }
  }, [loadScopeVariables, resetVariableTree])

  const handleContinue = useCallback(async () => {
    if (currentThreadId !== null) {
      try {
        await TauriAPI.debugContinue(currentThreadId)
        setIsPaused(false)
      } catch (error) {
        console.error('Failed to continue:', error)
      }
    }
  }, [currentThreadId])

  const handleStepOver = useCallback(async () => {
    if (currentThreadId !== null) {
      try {
        await TauriAPI.debugStepOver(currentThreadId)
        setIsPaused(false)
      } catch (error) {
        console.error('Failed to step over:', error)
      }
    }
  }, [currentThreadId])

  const handleStepInto = useCallback(async () => {
    if (currentThreadId !== null) {
      try {
        await TauriAPI.debugStepInto(currentThreadId)
        setIsPaused(false)
      } catch (error) {
        console.error('Failed to step into:', error)
      }
    }
  }, [currentThreadId])

  const handleStepOut = useCallback(async () => {
    if (currentThreadId !== null) {
      try {
        await TauriAPI.debugStepOut(currentThreadId)
        setIsPaused(false)
      } catch (error) {
        console.error('Failed to step out:', error)
      }
    }
  }, [currentThreadId])

  useEffect(() => {
    let unlistenStopped: (() => void) | undefined
    let unlistenContinued: (() => void) | undefined
    let unlistenTerminated: (() => void) | undefined

    const setupListeners = async () => {
      unlistenStopped = await listen<{ reason: string; threadId: number }>('debug-stopped', async (event) => {
        console.log('[DEBUG UI] Stopped:', event.payload)
        setIsPaused(true)
        setDebugState('paused')
        setCurrentThreadId(event.payload.threadId)

        try {
          const frames = await TauriAPI.getStackTrace(event.payload.threadId)
          setStackFrames(frames)

          if (frames.length > 0) {
            const firstFrame = frames[0]
            setSelectedFrameId(firstFrame.id)
            await loadFrameData(firstFrame.id)
          } else {
            setSelectedFrameId(null)
            setScopes([])
            resetVariableTree()
          }
        } catch (error) {
          console.error('Failed to get debug info:', error)
          setStackFrames([])
          setSelectedFrameId(null)
          setScopes([])
          resetVariableTree()
        }
      })

      unlistenContinued = await listen('debug-continued', () => {
        console.log('[DEBUG UI] Continued')
        setIsPaused(false)
        setDebugState('running')
      })

      unlistenTerminated = await listen('debug-terminated', () => {
        console.log('[DEBUG UI] Terminated')
        setIsPaused(false)
        setDebugState('idle')
        setStackFrames([])
        setCurrentThreadId(null)
        setSelectedFrameId(null)
        setScopes([])
        resetVariableTree()
      })
    }

    setupListeners()

    return () => {
      if (unlistenStopped) unlistenStopped()
      if (unlistenContinued) unlistenContinued()
      if (unlistenTerminated) unlistenTerminated()
    }
  }, [loadFrameData, resetVariableTree])

  // Keyboard shortcuts for debugging
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when panel is visible and paused
      if (!isVisible || !isPaused || currentThreadId === null) {
        return
      }

      // F5: Continue
      if (event.key === 'F5' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        void handleContinue()
      }
      // F10: Step Over
      else if (event.key === 'F10' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        void handleStepOver()
      }
      // F11: Step Into
      else if (event.key === 'F11' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        void handleStepInto()
      }
      // Shift+F11: Step Out
      else if (event.key === 'F11' && event.shiftKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        void handleStepOut()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, isPaused, currentThreadId, handleContinue, handleStepOver, handleStepInto, handleStepOut])

  const handleFrameClick = async (frame: StackFrame) => {
    setSelectedFrameId(frame.id)
    await loadFrameData(frame.id)
  }

  const handleScopeClick = async (scope: Scope) => {
    if (selectedScopeRef === scope.variables_reference && !isScopeLoading) {
      return
    }
    await loadScopeVariables(scope)
  }

  const toggleVariableExpand = async (variablesReference: number) => {
    if (variablesReference <= 0) {
      return
    }

    if (expandedVars.has(variablesReference)) {
      setExpandedVars(prev => {
        const next = new Set(prev)
        next.delete(variablesReference)
        return next
      })
      return
    }

    setExpandedVars(prev => new Set(prev).add(variablesReference))

    if (!variableChildren.has(variablesReference)) {
      setLoadingChildRefs(prev => {
        const next = new Set(prev)
        next.add(variablesReference)
        return next
      })

      try {
        const childVars = await TauriAPI.getVariables(variablesReference)
        setVariableChildren(prev => {
          const next = new Map(prev)
          next.set(variablesReference, childVars)
          return next
        })
      } catch (error) {
        console.error('Failed to get child variables:', error)
      } finally {
        setLoadingChildRefs(prev => {
          const next = new Set(prev)
          next.delete(variablesReference)
          return next
        })
      }
    }
  }

  const renderVariable = (variable: Variable, depth = 0, parentPath = '') => {
    const variablesReference = variable.variables_reference
    const isExpandable = variablesReference > 0
    const isExpanded = isExpandable && expandedVars.has(variablesReference)
    const isLoadingChildren = isExpandable && loadingChildRefs.has(variablesReference)
    const children = isExpandable ? variableChildren.get(variablesReference) : undefined

    // Create unique key using parent path and variable name
    const uniqueKey = `${parentPath}/${variable.name}:${variablesReference}:${depth}`

    return (
      <div key={uniqueKey} className="text-sm mb-1">
        <div
          className={`flex items-start gap-2 px-2 py-1 rounded transition-colors ${isExpandable ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
          style={{ backgroundColor: 'var(--ctp-surface0)', marginLeft: depth * 12 }}
          onClick={() => {
            if (isExpandable) {
              void toggleVariableExpand(variablesReference)
            }
          }}
        >
          {isExpandable && (
            <i
              className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} text-xs`}
              style={{ color: 'var(--ctp-overlay1)' }}
            ></i>
          )}
          {!isExpandable && (
            <span className="w-3" aria-hidden="true"></span>
          )}
          <div className="flex-1 min-w-0">
            <span style={{ color: 'var(--ctp-blue)' }} className="font-medium">{variable.name}</span>
            <span style={{ color: 'var(--ctp-overlay1)', margin: '0 0.25rem' }}>:</span>
            <span style={{ color: 'var(--ctp-green)' }} className="break-words">{variable.value}</span>
            {variable.type && (
              <span
                className="ml-2 text-xs uppercase tracking-wide"
                style={{ color: 'var(--ctp-overlay1)' }}
              >
                {variable.type}
              </span>
            )}
          </div>
        </div>
        {isExpanded && (
          <div className="ml-3">
            {isLoadingChildren && (
              <div className="text-xs px-2 py-1 italic" style={{ color: 'var(--ctp-overlay1)' }}>
                {t('debugPanel.loadingVariables')}
              </div>
            )}
            {!isLoadingChildren && (!children || children.length === 0) && (
              <div className="text-xs px-2 py-1 italic" style={{ color: 'var(--ctp-overlay1)' }}>
                {t('debugPanel.noChildVariables')}
              </div>
            )}
            {!isLoadingChildren && children && children.length > 0 &&
              children.map(child =>
                renderVariable(child, depth + 1, uniqueKey)
              )}
          </div>
        )}
      </div>
    )
  }

  const controlsEnabled = isPaused && currentThreadId !== null

  // Get status indicator properties based on debug state
  const getStatusProps = () => {
    switch (debugState) {
      case 'idle':
        return {
          icon: '⚪',
          text: t('debugPanel.statusIdle'),
          bgColor: 'var(--ctp-surface0)',
          textColor: 'var(--ctp-overlay1)'
        }
      case 'running':
        return {
          icon: '🟢',
          text: t('debugPanel.statusRunning'),
          subText: t('debugPanel.waitingForBreakpoint'),
          bgColor: 'var(--ctp-surface0)',
          textColor: 'var(--ctp-green)',
          animate: true
        }
      case 'paused':
        return {
          icon: '⏸️',
          text: t('debugPanel.statusPaused'),
          subText: currentThreadId ? `${t('debugPanel.thread')} ${currentThreadId}` : undefined,
          bgColor: 'var(--ctp-surface0)',
          textColor: 'var(--ctp-peach)'
        }
    }
  }

  const statusProps = getStatusProps()

  if (!isVisible) return null

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: 'var(--ctp-mantle)' }}
    >
      {/* Header */}
      <div className="panel-header flex items-center justify-between">
        <h3 className="font-semibold">{t('debugPanel.title')}</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-opacity-80 transition-colors"
          style={{ color: 'var(--ctp-text)' }}
          title={t('debugPanel.closeHint')}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Debug Status Indicator */}
      <div
        className="px-3 py-2 border-b flex items-center gap-2"
        style={{
          borderColor: 'var(--ctp-surface1)',
          backgroundColor: statusProps.bgColor
        }}
      >
        <span className={statusProps.animate ? 'debug-status-icon-pulse' : undefined}>
          {statusProps.icon}
        </span>
        <div className="flex-1">
          <div className="text-sm font-medium" style={{ color: statusProps.textColor }}>
            {statusProps.text}
          </div>
          {statusProps.subText && (
            <div className="text-xs" style={{ color: 'var(--ctp-overlay1)' }}>
              {statusProps.subText}
            </div>
          )}
        </div>
      </div>

      {/* Debug controls */}
      <div className="flex gap-2 p-2 border-b" style={{ borderColor: 'var(--ctp-surface1)' }}>
        <button
          onClick={handleContinue}
          disabled={!controlsEnabled}
          className="px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
          style={{
            backgroundColor: controlsEnabled ? 'var(--ctp-green)' : 'var(--ctp-surface0)',
            color: controlsEnabled ? 'var(--ctp-base)' : 'var(--ctp-overlay0)',
            opacity: controlsEnabled ? 1 : 0.5
          }}
          title={controlsEnabled ? "Continue (F5)" : t('debugPanel.buttonDisabledHint')}
        >
          <i className="fas fa-play"></i>
        </button>
        <button
          onClick={handleStepOver}
          disabled={!controlsEnabled}
          className="px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
          style={{
            backgroundColor: controlsEnabled ? 'var(--ctp-blue)' : 'var(--ctp-surface0)',
            color: controlsEnabled ? 'var(--ctp-base)' : 'var(--ctp-overlay0)',
            opacity: controlsEnabled ? 1 : 0.5
          }}
          title={controlsEnabled ? "Step Over (F10)" : t('debugPanel.buttonDisabledHint')}
        >
          <i className="fas fa-arrow-right"></i>
        </button>
        <button
          onClick={handleStepInto}
          disabled={!controlsEnabled}
          className="px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
          style={{
            backgroundColor: controlsEnabled ? 'var(--ctp-mauve)' : 'var(--ctp-surface0)',
            color: controlsEnabled ? 'var(--ctp-base)' : 'var(--ctp-overlay0)',
            opacity: controlsEnabled ? 1 : 0.5
          }}
          title={controlsEnabled ? "Step Into (F11)" : t('debugPanel.buttonDisabledHint')}
        >
          <i className="fas fa-arrow-down"></i>
        </button>
        <button
          onClick={handleStepOut}
          disabled={!controlsEnabled}
          className="px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
          style={{
            backgroundColor: controlsEnabled ? 'var(--ctp-peach)' : 'var(--ctp-surface0)',
            color: controlsEnabled ? 'var(--ctp-base)' : 'var(--ctp-overlay0)',
            opacity: controlsEnabled ? 1 : 0.5
          }}
          title={controlsEnabled ? "Step Out (Shift+F11)" : t('debugPanel.buttonDisabledHint')}
        >
          <i className="fas fa-arrow-up"></i>
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Call Stack */}
        <div className="border-b" style={{ borderColor: 'var(--ctp-surface1)' }}>
          <div className="px-3 py-2 font-semibold text-sm" style={{ color: 'var(--ctp-subtext1)' }}>
            {t('debugPanel.callStack')}
          </div>
          <div className="px-2 pb-2">
            {stackFrames.length === 0 ? (
              <div className="text-sm px-2 py-1" style={{ color: 'var(--ctp-overlay0)' }}>
                {debugState === 'idle' && t('debugPanel.callStackIdle')}
                {debugState === 'running' && t('debugPanel.callStackRunning')}
                {debugState === 'paused' && t('debugPanel.callStackEmpty')}
              </div>
            ) : (
              stackFrames.map(frame => (
                <div
                  key={frame.id}
                  onClick={() => handleFrameClick(frame)}
                  className="px-2 py-1 rounded text-sm cursor-pointer transition-colors"
                  style={{
                    backgroundColor: selectedFrameId === frame.id ? 'var(--ctp-surface1)' : 'transparent',
                    color: 'var(--ctp-text)'
                  }}
                >
                  <div className="font-medium">{frame.name}</div>
                  <div className="text-xs" style={{ color: 'var(--ctp-overlay1)' }}>
                    {frame.file}:{frame.line}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scopes */}
        <div className="border-b" style={{ borderColor: 'var(--ctp-surface1)' }}>
          <div className="px-3 py-2 font-semibold text-sm" style={{ color: 'var(--ctp-subtext1)' }}>
            {t('debugPanel.scopes')}
          </div>
          <div className="px-2 pb-2 flex flex-col gap-1">
            {scopes.length === 0 ? (
              <div className="text-sm px-2 py-1" style={{ color: 'var(--ctp-overlay0)' }}>
                {debugState === 'idle' && t('debugPanel.scopesIdle')}
                {debugState === 'running' && t('debugPanel.scopesRunning')}
                {debugState === 'paused' && t('debugPanel.scopesEmpty')}
              </div>
            ) : (
              scopes.map(scope => {
                const isSelected = selectedScopeRef === scope.variables_reference
                return (
                  <button
                    key={`${scope.name}-${scope.variables_reference}`}
                    onClick={() => handleScopeClick(scope)}
                    className="w-full text-left px-2 py-1 rounded text-sm transition-colors"
                    style={{
                      backgroundColor: isSelected ? 'var(--ctp-surface1)' : 'transparent',
                      color: 'var(--ctp-text)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{scope.name}</span>
                      {scope.expensive && (
                        <span className="text-xs" style={{ color: 'var(--ctp-overlay1)' }}>
                          {t('debugPanel.expensiveScope')}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Variables */}
        <div>
          <div className="px-3 py-2 font-semibold text-sm" style={{ color: 'var(--ctp-subtext1)' }}>
            {t('debugPanel.variables')}
          </div>
          <div className="px-2 pb-2">
            {isScopeLoading ? (
              <div className="text-sm px-2 py-1" style={{ color: 'var(--ctp-overlay0)' }}>
                {t('debugPanel.loadingVariables')}
              </div>
            ) : variables.length === 0 ? (
              <div className="text-sm px-2 py-1" style={{ color: 'var(--ctp-overlay0)' }}>
                {debugState === 'idle' && t('debugPanel.variablesIdle')}
                {debugState === 'running' && t('debugPanel.variablesRunning')}
                {debugState === 'paused' && (selectedScopeRef ? t('debugPanel.noVariables') : t('debugPanel.variablesNoScope'))}
              </div>
            ) : (
              variables.map(variable => renderVariable(variable))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
