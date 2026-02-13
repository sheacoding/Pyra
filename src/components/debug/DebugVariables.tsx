/**
 * [INPUT]: 依赖 react, react-i18next, ../../lib/tauri 的 Variable/Scope, ../Icon
 * [OUTPUT]: 对外提供 DebugVariables 组件
 * [POS]: debug/ 的变量树展示（含 recursive render 和 scope 选择）
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TauriAPI, type Variable, type Scope } from '../../lib/tauri'
import { Icon } from '../Icon'
import type { DebugState } from '../../types/debug'

interface DebugVariablesProps {
  scopes: Scope[]
  debugState: DebugState
}

export function DebugVariables({ scopes, debugState }: DebugVariablesProps) {
  const { t } = useTranslation()
  const [variables, setVariables] = useState<Variable[]>([])
  const [selectedScopeRef, setSelectedScopeRef] = useState<number | null>(null)
  const [expandedVars, setExpandedVars] = useState<Set<number>>(new Set())
  const [variableChildren, setVariableChildren] = useState<Map<number, Variable[]>>(new Map())
  const [loadingChildRefs, setLoadingChildRefs] = useState<Set<number>>(new Set())
  const [isScopeLoading, setIsScopeLoading] = useState(false)

  const loadScopeVariables = useCallback(async (scope: Scope) => {
    try {
      setIsScopeLoading(true)
      setSelectedScopeRef(scope.variables_reference)
      const vars = await TauriAPI.getVariables(scope.variables_reference)
      setVariables(vars)
      setExpandedVars(new Set())
      setVariableChildren(new Map())
      setLoadingChildRefs(new Set())
    } catch {
      setVariables([])
    } finally {
      setIsScopeLoading(false)
    }
  }, [])

  const handleScopeClick = async (scope: Scope) => {
    if (selectedScopeRef === scope.variables_reference && !isScopeLoading) return
    await loadScopeVariables(scope)
  }

  const toggleVariableExpand = async (variablesReference: number) => {
    if (variablesReference <= 0) return

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
      setLoadingChildRefs(prev => new Set(prev).add(variablesReference))
      try {
        const childVars = await TauriAPI.getVariables(variablesReference)
        setVariableChildren(prev => new Map(prev).set(variablesReference, childVars))
      } catch {
        // ignore
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
    const ref = variable.variables_reference
    const isExpandable = ref > 0
    const isExpanded = isExpandable && expandedVars.has(ref)
    const isLoadingChildren = isExpandable && loadingChildRefs.has(ref)
    const children = isExpandable ? variableChildren.get(ref) : undefined
    const uniqueKey = `${parentPath}/${variable.name}:${ref}:${depth}`

    return (
      <div key={uniqueKey} className="text-sm mb-1">
        <div
          className={`flex items-start gap-2 px-2 py-1 rounded transition-colors ${isExpandable ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
          style={{ backgroundColor: 'var(--ctp-surface0)', marginLeft: depth * 12 }}
          onClick={() => { if (isExpandable) void toggleVariableExpand(ref) }}
        >
          {isExpandable ? (
            <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={12} color="var(--ctp-overlay1)" />
          ) : (
            <span className="w-3" aria-hidden="true" />
          )}
          <div className="flex-1 min-w-0">
            <span style={{ color: 'var(--ctp-blue)' }} className="font-medium">{variable.name}</span>
            <span style={{ color: 'var(--ctp-overlay1)', margin: '0 0.25rem' }}>:</span>
            <span style={{ color: 'var(--ctp-green)' }} className="break-words">{variable.value}</span>
            {variable.type && (
              <span className="ml-2 text-xs uppercase tracking-wide" style={{ color: 'var(--ctp-overlay1)' }}>
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
            {!isLoadingChildren && children?.map(child => renderVariable(child, depth + 1, uniqueKey))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
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
            scopes.map(scope => (
              <button
                key={`${scope.name}-${scope.variables_reference}`}
                onClick={() => handleScopeClick(scope)}
                className="w-full text-left px-2 py-1 rounded text-sm transition-colors"
                style={{
                  backgroundColor: selectedScopeRef === scope.variables_reference ? 'var(--ctp-surface1)' : 'transparent',
                  color: 'var(--ctp-text)',
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
            ))
          )}
        </div>
      </div>

      {/* Variables */}
      <div className="border-b" style={{ borderColor: 'var(--ctp-surface1)' }}>
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
    </>
  )
}
