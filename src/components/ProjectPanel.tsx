import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TauriAPI } from '../lib/tauri'
import { PackageManager } from './PackageManager'
import { PyProjectManager } from './PyProjectManager'

interface ProjectPanelProps {
  projectPath: string
  onConsoleOutput?: (output: string) => void
  onConsoleError?: (error: string) => void
}

type PanelView = 'overview' | 'packages' | 'python' | 'settings'

export function ProjectPanel({ projectPath, onConsoleOutput, onConsoleError }: ProjectPanelProps) {
  const { t } = useTranslation()
  const [activeView, setActiveView] = useState<PanelView>('overview')
  const [venvExists, setVenvExists] = useState(false)
  const [pythonVersions, setPythonVersions] = useState<string[]>([])
  const [uvInstalled, setUvInstalled] = useState(false)

  useEffect(() => {
    checkProjectStatus()
  }, [projectPath])

  const checkProjectStatus = async () => {
    if (!projectPath) return

    try {
      // Check if virtual environment exists
      const venvCheck = await TauriAPI.checkVenvExists(projectPath)
      setVenvExists(venvCheck)

      // Check if uv is installed
      const uvCheck = await TauriAPI.checkUvInstalled()
      setUvInstalled(uvCheck)

      // Get available Python versions if uv is installed
      if (uvCheck) {
        try {
          const versions = await TauriAPI.listPythonVersions()
          setPythonVersions(versions)
        } catch (error) {
          console.warn('Failed to list Python versions:', error)
          setPythonVersions([])
        }
      }
    } catch (error) {
      onConsoleError?.(`Failed to check project status: ${error}`)
    }
  }

  const handleCreateVenv = async (pythonVersion?: string) => {
    if (!projectPath) return

    onConsoleOutput?.(t('messages.packageInstalling'))
    try {
      // Get project name from path
      const projectName = projectPath.split(/[\\/]/).pop() || 'pyra-project'

      // Initialize UV project
      const initResult = await TauriAPI.initUvProject(projectPath, projectName, pythonVersion)
      onConsoleOutput?.(t('messages.packageInstalled', { name: 'UV project' }))
      onConsoleOutput?.(`${initResult}`)

      // Sync dependencies
      onConsoleOutput?.(t('messages.syncingDependencies'))
      const syncResult = await TauriAPI.syncUvProject(projectPath)
      onConsoleOutput?.(t('messages.packageInstalled', { name: 'dependencies' }))
      onConsoleOutput?.(`${syncResult}`)

      setVenvExists(true)
    } catch (error) {
      onConsoleError?.(t('messages.venvCreateFailed', { error: String(error) }))

      // Fallback to old venv creation if UV init fails
      onConsoleOutput?.(t('messages.venvFallback'))
      try {
        const result = await TauriAPI.createVenv(projectPath, pythonVersion)
        onConsoleOutput?.(t('messages.venvCreated'))
        onConsoleOutput?.(`${result}`)
        setVenvExists(true)
      } catch (venvError) {
        onConsoleError?.(t('messages.venvCreateFailed', { error: String(venvError) }))
      }
    }
  }

  const NavButton = ({ view, label, icon }: { view: PanelView; label: string; icon: string }) => (
    <button
      onClick={() => setActiveView(view)}
      className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs rounded transition-colors min-w-[60px]"
      style={{
        backgroundColor: activeView === view ? 'var(--ctp-blue)' : 'transparent',
        color: activeView === view ? 'var(--ctp-base)' : 'var(--ctp-overlay1)',
        boxShadow: activeView === view ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (activeView !== view) {
          e.currentTarget.style.color = 'var(--ctp-text)'
          e.currentTarget.style.backgroundColor = 'var(--ctp-surface0)'
        }
      }}
      onMouseLeave={(e) => {
        if (activeView !== view) {
          e.currentTarget.style.color = 'var(--ctp-overlay1)'
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      <i className={`${icon} text-sm`}></i>
      <span className="font-medium">{label}</span>
    </button>
  )

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="p-4">
            <div className="space-y-4">
              {/* Project Info */}
              <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--ctp-mantle)' }}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--ctp-subtext1)' }}>
                  <i className="fas fa-info-circle text-blue-400"></i>
                  {t('projectPanel.overview.title')}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--ctp-overlay1)' }} className="flex items-center gap-2">
                      <i className="fas fa-folder text-xs"></i>
                      {t('projectPanel.overview.projectPath')}
                    </span>
                    <span className="font-mono text-xs" style={{ color: 'var(--ctp-text)' }}>{projectPath}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--ctp-overlay1)' }} className="flex items-center gap-2">
                      <i className="fas fa-cube text-xs"></i>
                      {t('projectPanel.overview.virtualEnv')}
                    </span>
                    <span style={{ color: venvExists ? 'var(--ctp-green)' : 'var(--ctp-red)' }} className="flex items-center gap-1">
                      <i className={venvExists ? 'fas fa-check' : 'fas fa-times'}></i>
                      {venvExists ? t('projectPanel.overview.active') : t('projectPanel.overview.notFound')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--ctp-overlay1)' }} className="flex items-center gap-2">
                      <i className="fas fa-package text-xs"></i>
                      {t('projectPanel.overview.uvPackageManager')}
                    </span>
                    <span style={{ color: uvInstalled ? 'var(--ctp-green)' : 'var(--ctp-red)' }} className="flex items-center gap-1">
                      <i className={uvInstalled ? 'fas fa-check' : 'fas fa-times'}></i>
                      {uvInstalled ? t('projectPanel.overview.installed') : t('projectPanel.overview.notFound')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--ctp-mantle)' }}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--ctp-subtext1)' }}>
                  <i className="fas fa-bolt text-yellow-400"></i>
                  {t('projectPanel.overview.quickActions')}
                </h3>
                <div className="space-y-2">
                  {!venvExists && (
                    <button
                      onClick={() => handleCreateVenv()}
                      className="w-full px-4 py-2 rounded text-sm transition-colors"
                      style={{ backgroundColor: 'var(--ctp-mauve)', color: 'var(--ctp-base)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)' }}
                    >
                      <i className="fas fa-rocket"></i> {t('projectPanel.overview.initUvProject')}
                    </button>
                  )}
                  {!uvInstalled && (
                    <div className="p-3 border rounded text-sm" style={{ backgroundColor: 'var(--ctp-yellow)' + '20', borderColor: 'var(--ctp-yellow)' + '50', color: 'var(--ctp-yellow)' }}>
                      <div className="font-semibold mb-1 flex items-center gap-2">
                        <i className="fas fa-exclamation-triangle"></i>
                        {t('projectPanel.overview.uvNotInstalled')}
                      </div>
                      <div>{t('projectPanel.overview.uvInstallHint')}</div>
                      <code className="block mt-2 p-2 rounded" style={{ backgroundColor: 'var(--ctp-surface0)' }}>curl -LsSf https://astral.sh/uv/install.sh | sh</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Stats */}
              {venvExists && (
                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--ctp-mantle)' }}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--ctp-subtext1)' }}>
                    <i className="fas fa-server text-green-400"></i>
                    {t('projectPanel.overview.environmentStatus')}
                  </h3>
                  <div className="text-sm" style={{ color: 'var(--ctp-text)' }}>
                    {t('projectPanel.overview.managePackagesHint')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'packages':
        return (
          <PackageManager 
            projectPath={projectPath}
            onConsoleOutput={onConsoleOutput}
            onConsoleError={onConsoleError}
          />
        )

      case 'python':
        return (
          <div className="p-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--ctp-mantle)' }}>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--ctp-subtext1)' }}>
                <i className="fab fa-python text-blue-400"></i>
                {t('projectPanel.python.title')}
              </h3>

              {!uvInstalled ? (
                <div className="text-center py-8" style={{ color: 'var(--ctp-overlay1)' }}>
                  <div className="text-4xl mb-4"><i className="fab fa-python text-blue-500"></i></div>
                  <div>{t('projectPanel.python.uvRequired')}</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--ctp-text)' }}>
                      <i className="fas fa-list-ul text-sm"></i>
                      {t('projectPanel.python.availableVersions')}
                    </label>
                    {pythonVersions.length === 0 ? (
                      <div className="text-sm" style={{ color: 'var(--ctp-overlay1)' }}>{t('projectPanel.python.noVersionsFound')}</div>
                    ) : (
                      <div className="space-y-2">
                        {pythonVersions.map((version) => (
                          <div key={version} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--ctp-surface0)' }}>
                            <span className="font-mono text-sm" style={{ color: 'var(--ctp-text)' }}>{version}</span>
                            <button
                              onClick={() => handleCreateVenv(version)}
                              disabled={venvExists}
                              className="px-3 py-1 text-xs rounded transition-colors"
                              style={{
                                backgroundColor: venvExists ? 'var(--ctp-surface2)' : 'var(--ctp-blue)',
                                color: venvExists ? 'var(--ctp-overlay0)' : 'var(--ctp-base)'
                              }}
                              onMouseEnter={(e) => {
                                if (!venvExists) {
                                  e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!venvExists) {
                                  e.currentTarget.style.backgroundColor = 'var(--ctp-blue)'
                                }
                              }}
                            >
                              {venvExists ? t('projectPanel.python.inUse') : t('projectPanel.python.use')}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'settings':
        return (
          <PyProjectManager 
            projectPath={projectPath}
            onConsoleOutput={onConsoleOutput}
            onConsoleError={onConsoleError}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--ctp-base)' }}>
      {/* Navigation */}
      <div className="px-3 py-3 border-b" style={{ backgroundColor: 'var(--ctp-mantle)', borderColor: 'var(--ctp-surface1)' }}>
        <div className="flex justify-between gap-1">
          <NavButton view="overview" label={t('projectPanel.tabs.overview')} icon="fas fa-home" />
          <NavButton view="packages" label={t('projectPanel.tabs.packages')} icon="fas fa-box" />
          <NavButton view="python" label={t('projectPanel.tabs.python')} icon="fab fa-python" />
          <NavButton view="settings" label={t('projectPanel.tabs.settings')} icon="fas fa-cog" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderActiveView()}
      </div>
    </div>
  )
}