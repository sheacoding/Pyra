import { useState, useEffect } from 'react'
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

    onConsoleOutput?.('Initializing UV project...')
    try {
      // Get project name from path
      const projectName = projectPath.split(/[\\/]/).pop() || 'pyra-project'
      
      // Initialize UV project
      const initResult = await TauriAPI.initUvProject(projectPath, projectName, pythonVersion)
      onConsoleOutput?.(`✅ UV project initialized successfully`)
      onConsoleOutput?.(`${initResult}`)
      
      // Sync dependencies
      onConsoleOutput?.('Syncing project dependencies...')
      const syncResult = await TauriAPI.syncUvProject(projectPath)
      onConsoleOutput?.(`✅ Dependencies synced successfully`)
      onConsoleOutput?.(`${syncResult}`)
      
      setVenvExists(true)
    } catch (error) {
      onConsoleError?.(`❌ Failed to initialize UV project: ${error}`)
      
      // Fallback to old venv creation if UV init fails
      onConsoleOutput?.('Falling back to traditional virtual environment creation...')
      try {
        const result = await TauriAPI.createVenv(projectPath, pythonVersion)
        onConsoleOutput?.(`✅ Virtual environment created successfully`)
        onConsoleOutput?.(`${result}`)
        setVenvExists(true)
      } catch (venvError) {
        onConsoleError?.(`❌ Failed to create virtual environment: ${venvError}`)
      }
    }
  }

  const NavButton = ({ view, label, icon }: { view: PanelView; label: string; icon: string }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs rounded transition-colors min-w-[60px] ${
        activeView === view
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
      }`}
    >
      <span className="text-sm">{icon}</span>
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
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Project Overview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Project Path:</span>
                    <span className="text-gray-300 font-mono text-xs">{projectPath}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Virtual Environment:</span>
                    <span className={venvExists ? 'text-green-400' : 'text-red-400'}>
                      {venvExists ? '✅ Active' : '❌ Not Found'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">UV Package Manager:</span>
                    <span className={uvInstalled ? 'text-green-400' : 'text-red-400'}>
                      {uvInstalled ? '✅ Installed' : '❌ Not Found'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {!venvExists && (
                    <button
                      onClick={() => handleCreateVenv()}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                    >
                      🚀 Initialize UV Project
                    </button>
                  )}
                  {!uvInstalled && (
                    <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-200 text-sm">
                      <div className="font-semibold mb-1">UV not installed</div>
                      <div>Install UV for faster Python package management:</div>
                      <code className="block mt-2 p-2 bg-gray-800 rounded">curl -LsSf https://astral.sh/uv/install.sh | sh</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Stats */}
              {venvExists && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-200 mb-3">Environment Status</h3>
                  <div className="text-sm text-gray-300">
                    Click on "Packages" tab to manage installed packages
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
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-3">Python Version Management</h3>
              
              {!uvInstalled ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-4">🐍</div>
                  <div>UV is required for Python version management</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Available Python Versions:
                    </label>
                    {pythonVersions.length === 0 ? (
                      <div className="text-gray-400 text-sm">No Python versions found via UV</div>
                    ) : (
                      <div className="space-y-2">
                        {pythonVersions.map((version) => (
                          <div key={version} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                            <span className="text-gray-300 font-mono text-sm">{version}</span>
                            <button
                              onClick={() => handleCreateVenv(version)}
                              disabled={venvExists}
                              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
                            >
                              {venvExists ? 'In Use' : 'Use'}
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
    <div className="h-full flex flex-col bg-gray-900">
      {/* Navigation */}
      <div className="px-3 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex justify-between gap-1">
          <NavButton view="overview" label="Overview" icon="🏠" />
          <NavButton view="packages" label="Packages" icon="📦" />
          <NavButton view="python" label="Python" icon="🐍" />
          <NavButton view="settings" label="Settings" icon="⚙️" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderActiveView()}
      </div>
    </div>
  )
}