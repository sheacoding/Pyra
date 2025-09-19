import { useState, useEffect } from 'react'
import { TauriAPI, type PyProjectToml, type ProjectMetadata } from '../lib/tauri'

interface PyProjectManagerProps {
  projectPath: string
  onConsoleOutput?: (output: string) => void
  onConsoleError?: (error: string) => void
}

export function PyProjectManager({ projectPath, onConsoleOutput, onConsoleError }: PyProjectManagerProps) {
  const [config, setConfig] = useState<PyProjectToml | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exists, setExists] = useState(false)
  const [newDependency, setNewDependency] = useState('')
  const [newDevDependency, setNewDevDependency] = useState('')

  useEffect(() => {
    loadConfig()
  }, [projectPath])

  const loadConfig = async () => {
    if (!projectPath) return
    
    setLoading(true)
    try {
      const pyprojectExists = await TauriAPI.checkPyProjectExists(projectPath)
      setExists(pyprojectExists)
      
      if (pyprojectExists) {
        const pyprojectConfig = await TauriAPI.readPyProjectToml(projectPath)
        setConfig(pyprojectConfig)
        onConsoleOutput?.('✅ Loaded pyproject.toml configuration\n')
      } else {
        // Create default config
        const projectName = projectPath.split(/[\\/]/).pop() || 'pyra-project'
        const defaultConfig: PyProjectToml = {
          project: {
            name: projectName,
            version: '0.1.0',
            description: 'A Python project created with Pyra IDE',
            authors: ['Your Name <your.email@example.com>'],
            requires_python: '>=3.8',
          },
          dependencies: [],
          dev_dependencies: [],
          build_system: {
            requires: ['setuptools', 'wheel'],
            build_backend: 'setuptools.build_meta'
          }
        }
        setConfig(defaultConfig)
        onConsoleOutput?.('📝 Created default pyproject.toml configuration\n')
      }
    } catch (error) {
      onConsoleError?.(`❌ Failed to load pyproject.toml: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config || !projectPath) return

    setSaving(true)
    try {
      await TauriAPI.writePyProjectToml(projectPath, config)
      setExists(true)
      onConsoleOutput?.('✅ Saved pyproject.toml successfully\n')
    } catch (error) {
      onConsoleError?.(`❌ Failed to save pyproject.toml: ${error}\n`)
    } finally {
      setSaving(false)
    }
  }

  const updateProjectMetadata = (field: keyof ProjectMetadata, value: any) => {
    if (!config) return
    setConfig({
      ...config,
      project: { ...config.project, [field]: value }
    })
  }

  const addDependency = () => {
    if (!config || !newDependency.trim()) return
    
    const updatedDeps = [...config.dependencies, newDependency.trim()]
    setConfig({ ...config, dependencies: updatedDeps })
    setNewDependency('')
  }

  const removeDependency = (index: number) => {
    if (!config) return
    
    const updatedDeps = config.dependencies.filter((_, i) => i !== index)
    setConfig({ ...config, dependencies: updatedDeps })
  }

  const addDevDependency = () => {
    if (!config || !newDevDependency.trim()) return
    
    const updatedDeps = [...config.dev_dependencies, newDevDependency.trim()]
    setConfig({ ...config, dev_dependencies: updatedDeps })
    setNewDevDependency('')
  }

  const removeDevDependency = (index: number) => {
    if (!config) return
    
    const updatedDeps = config.dev_dependencies.filter((_, i) => i !== index)
    setConfig({ ...config, dev_dependencies: updatedDeps })
  }

  const updateAuthors = (authorsString: string) => {
    const authors = authorsString.split(',').map(a => a.trim()).filter(a => a)
    updateProjectMetadata('authors', authors)
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        Loading pyproject.toml configuration...
      </div>
    )
  }

  if (!config) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="text-4xl mb-4"><i className="fas fa-file-alt"></i></div>
        <div className="text-lg mb-2">Failed to load configuration</div>
        <button 
          onClick={loadConfig}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <i className="fas fa-file-alt"></i> PyProject Configuration
            {exists && <span className="text-green-400 text-xs"><i className="fas fa-check"></i></span>}
            {!exists && <span className="text-yellow-400 text-xs"><i className="fas fa-exclamation-triangle"></i> Not saved</span>}
          </div>
          <button
            onClick={saveConfig}
            disabled={saving}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              saving
                ? 'bg-yellow-600 text-white cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {saving ? <><i className="fas fa-clock"></i> Saving...</> : <><i className="fas fa-save"></i> Save</>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Project Metadata */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-200 mb-4"><i className="fas fa-clipboard-list"></i> Project Information</h3>
          
          <div className="space-y-4">
            {/* First row - Project Name and Version */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                <input
                  type="text"
                  value={config.project.name}
                  onChange={(e) => updateProjectMetadata('name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Version</label>
                <input
                  type="text"
                  value={config.project.version}
                  onChange={(e) => updateProjectMetadata('version', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Second row - Description (full width) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={config.project.description || ''}
                onChange={(e) => updateProjectMetadata('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="Brief description of your project"
              />
            </div>
            
            {/* Third row - Authors and Python Version */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 h-8 flex items-end">Authors (comma-separated)</label>
                <input
                  type="text"
                  value={config.project.authors.join(', ')}
                  onChange={(e) => updateAuthors(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="John Doe <john@example.com>"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 h-8 flex items-end">Python Version Requirement</label>
                <input
                  type="text"
                  value={config.project.requires_python || ''}
                  onChange={(e) => updateProjectMetadata('requires_python', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder=">=3.8"
                />
              </div>
            </div>
            
            {/* Fourth row - License and README */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 h-8 flex items-end">License</label>
                <input
                  type="text"
                  value={config.project.license || ''}
                  onChange={(e) => updateProjectMetadata('license', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="MIT"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 h-8 flex items-end">README File</label>
                <input
                  type="text"
                  value={config.project.readme || ''}
                  onChange={(e) => updateProjectMetadata('readme', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="README.md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dependencies */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-200 mb-4"><i className="fas fa-box"></i> Dependencies</h3>
          
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newDependency}
                onChange={(e) => setNewDependency(e.target.value)}
                placeholder="requests>=2.28.0"
                className="flex-1 min-w-0 px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addDependency()}
              />
              <button
                onClick={addDependency}
                disabled={!newDependency.trim()}
                className="flex-shrink-0 px-2 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {config.dependencies.map((dep, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                <span className="text-gray-300 font-mono text-sm truncate mr-2">{dep}</span>
                <button
                  onClick={() => removeDependency(index)}
                  className="flex-shrink-0 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
            {config.dependencies.length === 0 && (
              <div className="text-gray-500 text-sm py-4 text-center">No dependencies added yet</div>
            )}
          </div>
        </div>

        {/* Dev Dependencies */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-200 mb-4"><i className="fas fa-tools"></i> Development Dependencies</h3>
          
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newDevDependency}
                onChange={(e) => setNewDevDependency(e.target.value)}
                placeholder="pytest>=7.0.0"
                className="flex-1 min-w-0 px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addDevDependency()}
              />
              <button
                onClick={addDevDependency}
                disabled={!newDevDependency.trim()}
                className="flex-shrink-0 px-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {config.dev_dependencies.map((dep, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                <span className="text-gray-300 font-mono text-sm truncate mr-2">{dep}</span>
                <button
                  onClick={() => removeDevDependency(index)}
                  className="flex-shrink-0 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
            {config.dev_dependencies.length === 0 && (
              <div className="text-gray-500 text-sm py-4 text-center">No dev dependencies added yet</div>
            )}
          </div>
        </div>

        {/* Build System */}
        {config.build_system && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-200 mb-4"><i className="fas fa-cog"></i> Build System</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Build Backend</label>
                <input
                  type="text"
                  value={config.build_system.build_backend}
                  onChange={(e) => setConfig({
                    ...config,
                    build_system: { ...config.build_system!, build_backend: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Build Requirements</label>
                <div className="space-y-2">
                  {config.build_system.requires.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => {
                          const newRequires = [...config.build_system!.requires]
                          newRequires[index] = e.target.value
                          setConfig({
                            ...config,
                            build_system: { ...config.build_system!, requires: newRequires }
                          })
                        }}
                        className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => {
                          const newRequires = config.build_system!.requires.filter((_, i) => i !== index)
                          setConfig({
                            ...config,
                            build_system: { ...config.build_system!, requires: newRequires }
                          })
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span><i className="fas fa-lightbulb"></i> Changes are not saved until you click the Save button</span>
          <span>pyproject.toml format compatible with UV and other Python tools</span>
        </div>
      </div>
    </div>
  )
}