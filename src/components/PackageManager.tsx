import { useState, useEffect } from 'react'
import { TauriAPI, type Package, type DependencyTree, type PackageWithDeps } from '../lib/tauri'

interface PackageManagerProps {
  projectPath: string
  onConsoleOutput?: (output: string) => void
  onConsoleError?: (error: string) => void
}

type ViewMode = 'list' | 'tree'

export function PackageManager({ projectPath, onConsoleOutput, onConsoleError }: PackageManagerProps) {
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
    onConsoleOutput?.(`Installing package: ${packageName}...`)

    try {
      const result = await TauriAPI.installPackage(projectPath, packageName)
      onConsoleOutput?.(`✅ Successfully installed ${packageName}`)
      onConsoleOutput?.(`${result}`)
      
      // Reload packages list
      await loadPackages()
      setInstallInput('')
    } catch (error) {
      onConsoleError?.(`❌ Failed to install ${packageName}: ${error}`)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleUninstallPackage = async (packageName: string) => {
    if (!projectPath || isInstalling) return

    setIsInstalling(true)
    onConsoleOutput?.(`Uninstalling package: ${packageName}...`)

    try {
      const result = await TauriAPI.uninstallPackage(projectPath, packageName)
      onConsoleOutput?.(`✅ Successfully uninstalled ${packageName}`)
      onConsoleOutput?.(`${result}`)
      
      // Reload packages list
      await loadPackages()
    } catch (error) {
      onConsoleError?.(`❌ Failed to uninstall ${packageName}: ${error}`)
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
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700 hover:bg-gray-750 transition-colors">
          <div className="flex items-center flex-1 min-w-0">
            <button
              onClick={() => togglePackageExpansion(pkg.name)}
              className="mr-2 text-gray-400 hover:text-gray-200"
              disabled={pkg.dependencies.length === 0}
            >
              {pkg.dependencies.length > 0 ? (isExpanded ? '▼' : '▶') : '◦'}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-200 truncate">{pkg.name}</div>
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span>v{pkg.version}</span>
                {pkg.dependencies.length > 0 && (
                  <span className="text-blue-400">({pkg.dependencies.length} deps)</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => window.open(`https://pypi.org/project/${pkg.name}/`, '_blank')}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              title="View on PyPI"
            >
              <i className="fas fa-external-link-alt"></i>
            </button>
            <button
              onClick={() => handleUninstallPackage(pkg.name)}
              disabled={isInstalling}
              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded transition-colors"
              title="Uninstall package"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        {isExpanded && pkg.dependencies.length > 0 && (
          <div className="ml-6 mt-2 border-l-2 border-gray-600 pl-4">
            {pkg.dependencies.map((dep) => (
              <div key={dep.name} className="mb-1 p-2 bg-gray-700 rounded text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-300 font-medium">{dep.name}</span>
                    <span className="text-gray-400 ml-2">v{dep.version}</span>
                  </div>
                  <button
                    onClick={() => window.open(`https://pypi.org/project/${dep.name}/`, '_blank')}
                    className="px-1 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                    title="View on PyPI"
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
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-300">Package Manager</div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-700 rounded">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs rounded-l transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-list"></i> List
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1 text-xs rounded-r transition-colors ${
                  viewMode === 'tree' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-sitemap"></i> Tree
              </button>
            </div>
            <button
              onClick={loadPackages}
              disabled={loading || isInstalling}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {/* Stats */}
        {(packages.length > 0 || dependencyTree) && (
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{packages.length} packages installed</span>
            {dependencyTree && (
              <span>{dependencyTree.total_count} root dependencies</span>
            )}
            {viewMode === 'tree' && dependencyTree && (
              <span className="text-blue-400">
                {dependencyTree.packages.reduce((acc, pkg) => acc + pkg.dependencies.length, 0)} sub-dependencies
              </span>
            )}
            {searchFilter && (
              <span className="text-green-400">
                {viewMode === 'tree' && filteredDependencyTree 
                  ? filteredDependencyTree.packages.length 
                  : filteredPackages.length} matches
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
              placeholder="Search packages..."
              className="w-full px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Install New Package */}
      <div className="p-4 bg-gray-850 border-b border-gray-700">
        <form onSubmit={handleInstallPackage} className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={installInput}
              onChange={(e) => setInstallInput(e.target.value)}
              disabled={isInstalling}
              placeholder="Package name (e.g., requests, numpy==1.24.0, git+https://...)"
              className="w-full px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500 disabled:bg-gray-800 disabled:text-gray-500"
            />
            {installInput && (
              <button
                type="button"
                onClick={() => setInstallInput('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isInstalling || !installInput.trim()}
            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors"
          >
            {isInstalling ? <><i className="fas fa-spinner fa-spin"></i> Installing...</> : <><i className="fas fa-download"></i> Install</>}
          </button>
        </form>
        
        {/* Quick install suggestions */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1 mb-2">
            <span className="text-xs text-gray-400 mr-2">Popular packages:</span>
            {['requests', 'numpy', 'pandas', 'matplotlib', 'flask', 'fastapi', 'pytest', 'black'].map((pkg) => (
              <button
                key={pkg}
                onClick={() => setInstallInput(pkg)}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
                disabled={isInstalling}
              >
                {pkg}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-gray-400 mr-2">Data science:</span>
            {['scikit-learn', 'tensorflow', 'torch', 'jupyter', 'seaborn', 'plotly'].map((pkg) => (
              <button
                key={pkg}
                onClick={() => setInstallInput(pkg)}
                className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-blue-200 text-xs rounded transition-colors"
                disabled={isInstalling}
              >
                {pkg}
              </button>
            ))}
          </div>
        </div>
        
        {/* Installation tips */}
        <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
          <i className="fas fa-lightbulb"></i> Tips: Use <code className="bg-gray-700 px-1 rounded">==version</code> for exact versions, 
          <code className="bg-gray-700 px-1 rounded">&gt;=version</code> for minimum versions, 
          or <code className="bg-gray-700 px-1 rounded">git+https://...</code> for git repositories
        </div>
      </div>

      {/* Package List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">Loading packages...</div>
        ) : packages.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-6xl mb-4"><i className="fas fa-box text-brown-600"></i></div>
            <div className="text-lg mb-2">No packages installed</div>
            <div className="text-sm">Install your first package using the form above</div>
          </div>
        ) : (
          <div className="p-2">
            {viewMode === 'tree' && filteredDependencyTree ? (
              // Tree view with dependency visualization
              filteredDependencyTree.packages.length > 0 ? (
                filteredDependencyTree.packages.map(renderPackageTree)
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <div className="text-4xl mb-4"><i className="fas fa-search text-gray-500"></i></div>
                  <div className="text-lg mb-2">No matching packages found</div>
                  <div className="text-sm">Try adjusting your search filter</div>
                </div>
              )
            ) : (
              // Simple list view
              filteredPackages.length > 0 ? (
                filteredPackages.map((pkg) => (
                  <div
                    key={pkg.name}
                    className="flex items-center justify-between p-3 mb-2 bg-gray-800 rounded border border-gray-700 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-200 truncate">{pkg.name}</div>
                      <div className="text-xs text-gray-400">v{pkg.version}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => window.open(`https://pypi.org/project/${pkg.name}/`, '_blank')}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        title="View on PyPI"
                      >
                        <i className="fas fa-external-link-alt"></i>
                      </button>
                      <button
                        onClick={() => handleUninstallPackage(pkg.name)}
                        disabled={isInstalling}
                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded transition-colors"
                        title="Uninstall package"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <div className="text-4xl mb-4"><i className="fas fa-search text-gray-500"></i></div>
                  <div className="text-lg mb-2">No matching packages found</div>
                  <div className="text-sm">Try adjusting your search filter</div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span><i className="fas fa-bolt text-yellow-500"></i> Using UV for fast package management</span>
          <div className="flex items-center gap-2">
            <span>{packages.length} package{packages.length !== 1 ? 's' : ''} installed</span>
            {viewMode === 'tree' && dependencyTree && (
              <span className="text-blue-400">
                ({dependencyTree.packages.reduce((acc, pkg) => acc + pkg.dependencies.length, 0)} dependencies)
              </span>
            )}
          </div>
        </div>
        {packages.length > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            <i className="fas fa-lightbulb"></i> Tip: {viewMode === 'tree' ? 'Click ▶ to expand dependencies' : 'Switch to Tree view to see dependencies'}
          </div>
        )}
      </div>
    </div>
  )
}