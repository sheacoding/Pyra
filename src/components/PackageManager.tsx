import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TauriAPI, type Package, type DependencyTree, type PackageWithDeps } from '../lib/tauri'

interface PackageManagerProps {
  projectPath: string
  onConsoleOutput?: (output: string) => void
  onConsoleError?: (error: string) => void
}

type ViewMode = 'list' | 'tree'

export function PackageManager({ projectPath, onConsoleOutput, onConsoleError }: PackageManagerProps) {
  const { t } = useTranslation()
  const [packages, setPackages] = useState<Package[]>([])
  const [dependencyTree, setDependencyTree] = useState<DependencyTree | null>(null)
  const [loading, setLoading] = useState(false)
  const [installInput, setInstallInput] = useState('')
  const [isInstalling, setIsInstalling] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set())
  const [searchFilter, setSearchFilter] = useState('')

  useEffect(() => {
    loadPackages()
  }, [projectPath])

  const loadPackages = async () => {
    if (!projectPath) return
    
    setLoading(true)
    try {
      // Load both simple package list and dependency tree
      const [packageList, depTree] = await Promise.all([
        TauriAPI.listPackages(projectPath),
        TauriAPI.getDependencyTree(projectPath).catch(() => null) // Don't fail if tree fails
      ])
      
      setPackages(packageList)
      setDependencyTree(depTree)
    } catch (error) {
      onConsoleError?.(`Failed to load packages: ${error}`)
      setPackages([])
      setDependencyTree(null)
    } finally {
      setLoading(false)
    }
  }

  const handleInstallPackage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!installInput.trim() || isInstalling || !projectPath) return

    const packageName = installInput.trim()
    setIsInstalling(true)
    onConsoleOutput?.(t('messages.packageInstalling', { name: packageName }))

    try {
      const result = await TauriAPI.installPackage(projectPath, packageName)
      onConsoleOutput?.(t('messages.packageInstalled', { name: packageName }))
      onConsoleOutput?.(`${result}`)

      // Reload packages list
      await loadPackages()
      setInstallInput('')
    } catch (error) {
      onConsoleError?.(t('messages.packageInstallFailed', { name: packageName, error: String(error) }))
    } finally {
      setIsInstalling(false)
    }
  }

  const handleUninstallPackage = async (packageName: string) => {
    if (!projectPath || isInstalling) return

    setIsInstalling(true)
    onConsoleOutput?.(t('messages.packageUninstalling', { name: packageName }))

    try {
      const result = await TauriAPI.uninstallPackage(projectPath, packageName)
      onConsoleOutput?.(t('messages.packageUninstalled', { name: packageName }))
      onConsoleOutput?.(`${result}`)

      // Reload packages list
      await loadPackages()
    } catch (error) {
      onConsoleError?.(t('messages.packageUninstallFailed', { name: packageName, error: String(error) }))
    } finally {
      setIsInstalling(false)
    }
  }

  const togglePackageExpansion = (packageName: string) => {
    setExpandedPackages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(packageName)) {
        newSet.delete(packageName)
      } else {
        newSet.add(packageName)
      }
      return newSet
    })
  }

  // Filter packages based on search input
  const filteredPackages = packages.filter(pkg => 
    pkg.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    pkg.version.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const filteredDependencyTree = dependencyTree ? {
    ...dependencyTree,
    packages: dependencyTree.packages.filter(pkg => 
      pkg.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      pkg.version.toLowerCase().includes(searchFilter.toLowerCase()) ||
      pkg.dependencies.some(dep => 
        dep.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        dep.version.toLowerCase().includes(searchFilter.toLowerCase())
      )
    )
  } : null

  const renderPackageTree = (pkg: PackageWithDeps) => {
    const isExpanded = expandedPackages.has(pkg.name)
    return (
      <div key={pkg.name} className="mb-2">
        <div className="flex items-center justify-between p-3 rounded border transition-colors"
             style={{
               backgroundColor: 'var(--ctp-surface0)',
               borderColor: 'var(--ctp-surface1)'
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.backgroundColor = 'var(--ctp-surface1)'
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.backgroundColor = 'var(--ctp-surface0)'
             }}>
          <div className="flex items-center flex-1 min-w-0">
            <button
              onClick={() => togglePackageExpansion(pkg.name)}
              className="mr-2 transition-colors"
              style={{
                color: 'var(--ctp-subtext1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--ctp-text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--ctp-subtext1)'
              }}
              disabled={pkg.dependencies.length === 0}
            >
              {pkg.dependencies.length > 0 ? (isExpanded ? '▼' : '▶') : '◦'}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--ctp-text)' }}>{pkg.name}</div>
              <div className="text-xs flex items-center gap-2" style={{ color: 'var(--ctp-subtext1)' }}>
                <span>v{pkg.version}</span>
                {pkg.dependencies.length > 0 && (
                  <span style={{ color: 'var(--ctp-blue)' }}>({pkg.dependencies.length} {t('packageManager.dependencies')})</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => window.open(`https://pypi.org/project/${pkg.name}/`, '_blank')}
              className="px-2 py-1 text-xs rounded transition-colors"
              style={{
                backgroundColor: 'var(--ctp-blue)',
                color: 'var(--ctp-base)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--ctp-blue)'
              }}
              title={t('packageManager.viewOnPyPI')}
            >
              <i className="fas fa-external-link-alt"></i>
            </button>
            <button
              onClick={() => handleUninstallPackage(pkg.name)}
              disabled={isInstalling}
              className="px-2 py-1 text-xs rounded transition-colors"
              style={{
                backgroundColor: isInstalling ? 'var(--ctp-surface2)' : 'var(--ctp-red)',
                color: 'var(--ctp-base)'
              }}
              onMouseEnter={(e) => {
                if (!isInstalling) {
                  e.currentTarget.style.backgroundColor = 'var(--ctp-maroon)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isInstalling) {
                  e.currentTarget.style.backgroundColor = 'var(--ctp-red)'
                }
              }}
              title={t('packageManager.uninstall')}
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        {isExpanded && pkg.dependencies.length > 0 && (
          <div className="ml-6 mt-2 border-l-2 pl-4" style={{ borderColor: 'var(--ctp-surface2)' }}>
            {pkg.dependencies.map((dep) => (
              <div key={dep.name} className="mb-1 p-2 rounded text-sm" style={{ backgroundColor: 'var(--ctp-surface1)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium" style={{ color: 'var(--ctp-text)' }}>{dep.name}</span>
                    <span className="ml-2" style={{ color: 'var(--ctp-subtext1)' }}>v{dep.version}</span>
                  </div>
                  <button
                    onClick={() => window.open(`https://pypi.org/project/${dep.name}/`, '_blank')}
                    className="px-1 py-0.5 text-xs rounded"
                    style={{
                      backgroundColor: 'var(--ctp-blue)',
                      color: 'var(--ctp-base)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--ctp-blue)'
                    }}
                    title={t('packageManager.viewOnPyPI')}
                  >
                    <i className="fas fa-external-link-alt"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--ctp-base)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ backgroundColor: 'var(--ctp-mantle)', borderColor: 'var(--ctp-surface1)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold" style={{ color: 'var(--ctp-text)' }}>{t('packageManager.title')}</div>
          <div className="flex items-center gap-2">
            <div className="flex rounded" style={{ backgroundColor: 'var(--ctp-surface0)' }}>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs rounded-l transition-colors ${
                  viewMode === 'list'
                    ? ''
                    : ''
                }`}
                style={{
                  backgroundColor: viewMode === 'list' ? 'var(--ctp-blue)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--ctp-base)' : 'var(--ctp-text)'
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'list') {
                    e.currentTarget.style.backgroundColor = 'var(--ctp-surface1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'list') {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <i className="fas fa-list"></i> {t('packageManager.viewList')}
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1 text-xs rounded-r transition-colors`}
                style={{
                  backgroundColor: viewMode === 'tree' ? 'var(--ctp-blue)' : 'transparent',
                  color: viewMode === 'tree' ? 'var(--ctp-base)' : 'var(--ctp-text)'
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'tree') {
                    e.currentTarget.style.backgroundColor = 'var(--ctp-surface1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'tree') {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <i className="fas fa-sitemap"></i> {t('packageManager.viewTree')}
              </button>
            </div>
            <button
              onClick={loadPackages}
              disabled={loading || isInstalling}
              className="px-2 py-1 text-xs rounded transition-colors"
              style={{
                backgroundColor: loading || isInstalling ? 'var(--ctp-surface2)' : 'var(--ctp-blue)',
                color: 'var(--ctp-base)'
              }}
              onMouseEnter={(e) => {
                if (!loading && !isInstalling) {
                  e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !isInstalling) {
                  e.currentTarget.style.backgroundColor = 'var(--ctp-blue)'
                }
              }}
            >
              {loading ? t('packageManager.loading') : t('packageManager.refresh')}
            </button>
          </div>
        </div>
        
        {/* Stats */}
        {(packages.length > 0 || dependencyTree) && (
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--ctp-subtext1)' }}>
            <span>{t('packageManager.packagesInstalled', { count: packages.length })}</span>
            {dependencyTree && (
              <span>{t('packageManager.rootDependencies', { count: dependencyTree.total_count })}</span>
            )}
            {viewMode === 'tree' && dependencyTree && (
              <span style={{ color: 'var(--ctp-blue)' }}>
                {t('packageManager.subDependencies', { count: dependencyTree.packages.reduce((acc, pkg) => acc + pkg.dependencies.length, 0) })}
              </span>
            )}
            {searchFilter && (
              <span style={{ color: 'var(--ctp-green)' }}>
                {t('packageManager.matches', { count: viewMode === 'tree' && filteredDependencyTree
                  ? filteredDependencyTree.packages.length
                  : filteredPackages.length })}
              </span>
            )}
          </div>
        )}
        
        {/* Search Filter */}
        {packages.length > 0 && (
          <div className="mt-3">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={t('packageManager.searchPlaceholder')}
              className="w-full px-3 py-2 text-sm rounded border focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--ctp-surface0)',
                color: 'var(--ctp-text)',
                borderColor: 'var(--ctp-surface2)'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ctp-blue)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ctp-surface2)'}
            />
          </div>
        )}
      </div>

      {/* Install New Package */}
      <div className="p-4 border-b" style={{ backgroundColor: 'var(--ctp-mantle)', borderColor: 'var(--ctp-surface1)' }}>
        <form onSubmit={handleInstallPackage} className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={installInput}
              onChange={(e) => setInstallInput(e.target.value)}
              disabled={isInstalling}
              placeholder={t('packageManager.installPlaceholder')}
              className="w-full px-3 py-2 text-sm rounded border focus:outline-none transition-colors"
              style={{
                backgroundColor: isInstalling ? 'var(--ctp-surface1)' : 'var(--ctp-surface0)',
                color: isInstalling ? 'var(--ctp-subtext0)' : 'var(--ctp-text)',
                borderColor: 'var(--ctp-surface2)'
              }}
              onFocus={(e) => {
                if (!isInstalling) e.currentTarget.style.borderColor = 'var(--ctp-blue)'
              }}
              onBlur={(e) => {
                if (!isInstalling) e.currentTarget.style.borderColor = 'var(--ctp-surface2)'
              }}
            />
            {installInput && (
              <button
                type="button"
                onClick={() => setInstallInput('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 transition-colors"
                style={{ color: 'var(--ctp-subtext1)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--ctp-text)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--ctp-subtext1)'}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isInstalling || !installInput.trim()}
            className="px-4 py-2 text-sm rounded transition-colors"
            style={{
              backgroundColor: isInstalling || !installInput.trim() ? 'var(--ctp-surface2)' : 'var(--ctp-green)',
              color: 'var(--ctp-base)'
            }}
            onMouseEnter={(e) => {
              if (!isInstalling && installInput.trim()) {
                e.currentTarget.style.backgroundColor = 'var(--ctp-teal)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isInstalling && installInput.trim()) {
                e.currentTarget.style.backgroundColor = 'var(--ctp-green)'
              }
            }}
          >
            {isInstalling ? <><i className="fas fa-spinner fa-spin"></i> {t('packageManager.installing')}</> : <><i className="fas fa-download"></i> {t('packageManager.install')}</>}
          </button>
        </form>
        
        {/* Quick install suggestions */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1 mb-2">
            <span className="text-xs mr-2" style={{ color: 'var(--ctp-subtext1)' }}>{t('packageManager.popularPackages')}</span>
            {['requests', 'numpy', 'pandas', 'matplotlib', 'flask', 'fastapi', 'pytest', 'black'].map((pkg) => (
              <button
                key={pkg}
                onClick={() => setInstallInput(pkg)}
                className="px-2 py-1 text-xs rounded transition-colors"
                style={{
                  backgroundColor: isInstalling ? 'var(--ctp-surface1)' : 'var(--ctp-surface0)',
                  color: 'var(--ctp-text)'
                }}
                onMouseEnter={(e) => {
                  if (!isInstalling) e.currentTarget.style.backgroundColor = 'var(--ctp-surface1)'
                }}
                onMouseLeave={(e) => {
                  if (!isInstalling) e.currentTarget.style.backgroundColor = 'var(--ctp-surface0)'
                }}
                disabled={isInstalling}
              >
                {pkg}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-xs mr-2" style={{ color: 'var(--ctp-subtext1)' }}>{t('packageManager.dataScience')}</span>
            {['scikit-learn', 'opencv-python', 'torch', 'marimo', 'seaborn', 'plotly'].map((pkg) => (
              <button
                key={pkg}
                onClick={() => setInstallInput(pkg)}
                className="px-2 py-1 text-xs rounded transition-colors"
                style={{
                  backgroundColor: isInstalling ? 'var(--ctp-surface1)' : 'var(--ctp-sapphire)',
                  color: 'var(--ctp-base)'
                }}
                onMouseEnter={(e) => {
                  if (!isInstalling) {
                    e.currentTarget.style.backgroundColor = 'var(--ctp-blue)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isInstalling) {
                    e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)'
                  }
                }}
                disabled={isInstalling}
              >
                {pkg}
              </button>
            ))}
          </div>
        </div>
        
        {/* Installation tips */}
        <div className="text-xs p-2 rounded" style={{
          color: 'var(--ctp-subtext0)',
          backgroundColor: 'var(--ctp-surface0)'
        }}>
          <i className="fas fa-lightbulb"></i> {t('packageManager.tips')} <code className="px-1 rounded" style={{ backgroundColor: 'var(--ctp-surface1)' }}>{t('packageManager.exactVersion')}</code> {t('packageManager.forExact')}
          <code className="px-1 rounded" style={{ backgroundColor: 'var(--ctp-surface1)' }}>{t('packageManager.minVersion')}</code> {t('packageManager.forMin')}
          {t('packageManager.orGit')} <code className="px-1 rounded" style={{ backgroundColor: 'var(--ctp-surface1)' }}>{t('packageManager.gitRepo')}</code> {t('packageManager.forGitRepos')}
        </div>
      </div>

      {/* Package List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center" style={{ color: 'var(--ctp-subtext1)' }}>{t('packageManager.loading')}</div>
        ) : packages.length === 0 ? (
          <div className="p-4 text-center" style={{ color: 'var(--ctp-subtext0)' }}>
            <div className="text-6xl mb-4"><i className="fas fa-box" style={{ color: 'var(--ctp-peach)' }}></i></div>
            <div className="text-lg mb-2">{t('packageManager.noPackages')}</div>
            <div className="text-sm">{t('packageManager.installFirst')}</div>
          </div>
        ) : (
          <div className="p-2">
            {viewMode === 'tree' && filteredDependencyTree ? (
              // Tree view with dependency visualization
              filteredDependencyTree.packages.length > 0 ? (
                filteredDependencyTree.packages.map(renderPackageTree)
              ) : (
                <div className="p-4 text-center" style={{ color: 'var(--ctp-subtext0)' }}>
                  <div className="text-4xl mb-4"><i className="fas fa-search" style={{ color: 'var(--ctp-subtext0)' }}></i></div>
                  <div className="text-lg mb-2">{t('packageManager.noMatches')}</div>
                  <div className="text-sm">{t('packageManager.adjustFilter')}</div>
                </div>
              )
            ) : (
              // Simple list view
              filteredPackages.length > 0 ? (
                filteredPackages.map((pkg) => (
                  <div
                    key={pkg.name}
                    className="flex items-center justify-between p-3 mb-2 rounded border transition-colors"
                    style={{
                      backgroundColor: 'var(--ctp-surface0)',
                      borderColor: 'var(--ctp-surface1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--ctp-surface1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--ctp-surface0)'
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--ctp-text)' }}>{pkg.name}</div>
                      <div className="text-xs" style={{ color: 'var(--ctp-subtext1)' }}>v{pkg.version}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => window.open(`https://pypi.org/project/${pkg.name}/`, '_blank')}
                        className="px-2 py-1 text-xs rounded transition-colors"
                        style={{
                          backgroundColor: 'var(--ctp-blue)',
                          color: 'var(--ctp-base)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--ctp-sapphire)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--ctp-blue)'
                        }}
                        title={t('packageManager.viewOnPyPI')}
                      >
                        <i className="fas fa-external-link-alt"></i>
                      </button>
                      <button
                        onClick={() => handleUninstallPackage(pkg.name)}
                        disabled={isInstalling}
                        className="px-2 py-1 text-xs rounded transition-colors"
                        style={{
                          backgroundColor: isInstalling ? 'var(--ctp-surface2)' : 'var(--ctp-red)',
                          color: 'var(--ctp-base)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isInstalling) {
                            e.currentTarget.style.backgroundColor = 'var(--ctp-maroon)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isInstalling) {
                            e.currentTarget.style.backgroundColor = 'var(--ctp-red)'
                          }
                        }}
                        title={t('packageManager.uninstall')}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center" style={{ color: 'var(--ctp-subtext0)' }}>
                  <div className="text-4xl mb-4"><i className="fas fa-search" style={{ color: 'var(--ctp-subtext0)' }}></i></div>
                  <div className="text-lg mb-2">{t('packageManager.noMatches')}</div>
                  <div className="text-sm">{t('packageManager.adjustFilter')}</div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t text-xs" style={{
        backgroundColor: 'var(--ctp-mantle)',
        borderColor: 'var(--ctp-surface1)',
        color: 'var(--ctp-subtext1)'
      }}>
        <div className="flex items-center justify-between">
          <span><i className="fas fa-bolt" style={{ color: 'var(--ctp-yellow)' }}></i> {t('packageManager.usingUV')}</span>
          <div className="flex items-center gap-2">
            <span>{packages.length} {packages.length !== 1 ? t('packageManager.packages') : t('packageManager.package')}</span>
            {viewMode === 'tree' && dependencyTree && (
              <span style={{ color: 'var(--ctp-blue)' }}>
                ({dependencyTree.packages.reduce((acc, pkg) => acc + pkg.dependencies.length, 0)} {t('packageManager.dependencies')})
              </span>
            )}
          </div>
        </div>
        {packages.length > 0 && (
          <div className="mt-1 text-xs" style={{ color: 'var(--ctp-subtext0)' }}>
            <i className="fas fa-lightbulb"></i> {viewMode === 'tree' ? t('packageManager.expandTip') : t('packageManager.treeTip')}
          </div>
        )}
      </div>
    </div>
  )
}