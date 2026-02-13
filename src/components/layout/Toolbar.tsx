/**
 * [INPUT]: 依赖 react, react-i18next, ../Icon, ../../lib/constants
 * [OUTPUT]: 对外提供 Toolbar 组件
 * [POS]: layout/ 的顶部工具栏，从 App.tsx 提取
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { MutableRefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'
import { IS_MACOS } from '../../lib/constants'

/* ================================================================
 * Props
 * ================================================================ */

interface ToolbarProps {
  /* 状态 */
  workspaceReady: boolean
  currentFile: string | null
  uvReady: boolean
  uvInstalling: boolean
  isDebugging: boolean
  showProjectPanel: boolean
  showDebugMenu: boolean
  debugMenuRef: MutableRefObject<HTMLDivElement | null>

  /* 操作 */
  onNewProject: () => void
  onOpenProject: () => void
  onNewFile: () => void
  onNewFolder: () => void
  onRefresh: () => void
  onOpenFile: () => void
  onSaveFile: () => void
  onRun: () => void
  onStop: () => void
  onFormat: () => void
  onLint: () => void
  onToggleDebugMenu: () => void
  onDebugMode: (mode: 'debug' | 'step' | 'visual') => void
  onToggleProjectPanel: (e?: React.MouseEvent) => void
  onOpenSettings: () => void
}

/* ================================================================
 * Toolbar
 * ================================================================ */

export function Toolbar({
  workspaceReady, currentFile, uvReady, uvInstalling,
  isDebugging, showProjectPanel, showDebugMenu, debugMenuRef,
  onNewProject, onOpenProject, onNewFile, onNewFolder, onRefresh,
  onOpenFile, onSaveFile, onRun, onStop, onFormat, onLint,
  onToggleDebugMenu, onDebugMode, onToggleProjectPanel, onOpenSettings,
}: ToolbarProps) {
  const { t } = useTranslation()

  const pythonFileSelected = Boolean(currentFile?.endsWith('.py'))
  const actionDisabled = !pythonFileSelected || !uvReady || uvInstalling || !workspaceReady

  return (
    <div
      className={`toolbar-container h-9 flex items-stretch flex-shrink-0 ${IS_MACOS ? 'macos-titlebar' : ''}`}
      style={{ backgroundColor: 'var(--ctp-mantle)', borderBottom: '1px solid var(--ctp-surface0)' }}
    >
      {/* 侧边栏: 项目 + 资源管理器 */}
      <div
        className="sidebar-toolbar w-48 sm:w-56 md:w-64 flex items-center px-2 border-r flex-shrink-0"
        style={{ borderColor: 'var(--ctp-surface0)' }}
      >
        <div className="flex items-center gap-0.5">
          <button onClick={onNewProject} className="toolbar-icon-btn" title={t('toolbar.newProject')}>
            <Icon name="plus" color="var(--ctp-green)" />
          </button>
          <button onClick={onOpenProject} className="toolbar-icon-btn" title={t('toolbar.openProject')}>
            <Icon name="folder" color="var(--ctp-blue)" />
          </button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          <button onClick={onNewFile} disabled={!workspaceReady} className="toolbar-icon-btn" title={t('toolbar.newFile')}>
            <Icon name="file-plus" color={workspaceReady ? 'var(--ctp-text)' : 'var(--ctp-overlay0)'} />
          </button>
          <button onClick={onNewFolder} disabled={!workspaceReady} className="toolbar-icon-btn" title={t('toolbar.newFolder')}>
            <Icon name="folder-plus" color={workspaceReady ? 'var(--ctp-text)' : 'var(--ctp-overlay0)'} />
          </button>
          <button onClick={onRefresh} disabled={!workspaceReady} className="toolbar-icon-btn" title={t('toolbar.refresh')}>
            <Icon name="refresh" color={workspaceReady ? 'var(--ctp-text)' : 'var(--ctp-overlay0)'} />
          </button>
        </div>
      </div>

      {/* 编辑器主控制 */}
      <div className="flex-1 flex items-center h-full">
        {/* 文件操作 */}
        <div className="toolbar-section">
          <button onClick={onOpenFile} className="toolbar-icon-btn" title={t('toolbar.openFile')}>
            <Icon name="folder-open" color="var(--ctp-text)" />
          </button>
          <button onClick={onSaveFile} disabled={!currentFile} className="toolbar-icon-btn" title={t('toolbar.save')}>
            <Icon name="save" color={currentFile ? 'var(--ctp-text)' : 'var(--ctp-overlay0)'} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* 执行控制 */}
        <div className="toolbar-section">
          <button
            onClick={onRun}
            disabled={actionDisabled}
            className="toolbar-run-btn"
            style={{ opacity: actionDisabled ? 0.4 : 1 }}
            title={t('toolbar.run')}
          >
            <Icon name="play" size={12} />
          </button>
          <button onClick={onStop} className="toolbar-icon-btn" title={t('toolbar.stop')}>
            <Icon name="stop" size={14} color="var(--ctp-red)" />
          </button>

          {/* 调试菜单 */}
          <div className="relative" ref={debugMenuRef}>
            <button
              onClick={onToggleDebugMenu}
              disabled={actionDisabled}
              className="toolbar-icon-btn relative"
              title={t('toolbar.debug')}
            >
              <Icon name="bug" color={actionDisabled ? 'var(--ctp-overlay0)' : 'var(--ctp-peach)'} />
              {isDebugging && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--ctp-green)' }} />
              )}
            </button>
            {showDebugMenu && (
              <div
                className="absolute top-full left-0 mt-1 py-1 rounded-md shadow-lg z-50 min-w-[140px]"
                style={{ backgroundColor: 'var(--ctp-surface0)', border: '1px solid var(--ctp-surface1)' }}
              >
                <button onClick={() => onDebugMode('debug')} className="dropdown-item">
                  <Icon name="bug" size={14} />
                  <span>{t('toolbar.debugMenu.debug')}</span>
                </button>
                <button onClick={() => onDebugMode('step')} className="dropdown-item">
                  <Icon name="step" size={14} />
                  <span>{t('toolbar.debugMenu.stepDebug')}</span>
                </button>
                <button onClick={() => onDebugMode('visual')} className="dropdown-item">
                  <Icon name="eye" size={14} />
                  <span>{t('toolbar.debugMenu.visualDebug')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-divider" />

        {/* 代码质量 */}
        <div className="toolbar-section">
          <button onClick={onFormat} disabled={actionDisabled} className="toolbar-icon-btn" title={t('toolbar.format')}>
            <Icon name="wand" color={actionDisabled ? 'var(--ctp-overlay0)' : 'var(--ctp-text)'} />
          </button>
          <button onClick={onLint} disabled={actionDisabled} className="toolbar-icon-btn" title={t('toolbar.lint')}>
            <Icon name="search-code" color={actionDisabled ? 'var(--ctp-overlay0)' : 'var(--ctp-text)'} />
          </button>
        </div>

        <div className="flex-1" />

        {/* 右侧控制 */}
        <div className="toolbar-section pr-2">
          <button
            onClick={(e) => onToggleProjectPanel(e)}
            disabled={!workspaceReady}
            className="toolbar-icon-btn"
            aria-pressed={showProjectPanel}
            title={showProjectPanel ? t('toolbar.hideProjectPanel') : t('toolbar.showProjectPanel')}
          >
            <Icon name="cubes" color={!workspaceReady ? 'var(--ctp-overlay0)' : (showProjectPanel ? 'var(--ctp-blue)' : 'var(--ctp-text)')} />
          </button>
          <button onClick={onOpenSettings} className="toolbar-icon-btn" title={t('toolbar.settings')}>
            <Icon name="gear" color="var(--ctp-text)" />
          </button>
        </div>
      </div>
    </div>
  )
}
