import { useState, useEffect } from 'react'
import { TauriAPI, ProjectTemplate } from '../lib/tauri'

interface ProjectTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (templateId: string, projectName: string, projectPath: string) => void
}

export function ProjectTemplateDialog({ isOpen, onClose, onCreateProject }: ProjectTemplateDialogProps) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [projectName, setProjectName] = useState('')
  const [projectPath, setProjectPath] = useState('')
  const [pythonVersion, setPythonVersion] = useState('3.11')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const templateList = await TauriAPI.getProjectTemplates()
      setTemplates(templateList)
      if (templateList.length > 0) {
        setSelectedTemplate(templateList[0].id)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!selectedTemplate || !projectName.trim() || !projectPath.trim()) {
      alert('Please fill in all fields')
      return
    }

    setCreating(true)
    try {
      const fullProjectPath = `${projectPath}/${projectName.trim()}`
      await TauriAPI.createProjectFromTemplate(fullProjectPath, selectedTemplate, projectName.trim(), pythonVersion)
      onCreateProject(selectedTemplate, projectName.trim(), fullProjectPath)
      handleClose()
    } catch (error) {
      console.error('Failed to create project:', error)
      alert(`Failed to create project: ${error}`)
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    setSelectedTemplate('')
    setProjectName('')
    setProjectPath('')
    onClose()
  }

  const selectedTemplateObj = templates.find(t => t.id === selectedTemplate)

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, ProjectTemplate[]>)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-5/6 max-w-6xl h-5/6 max-h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">🚀 Create New Project</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">{/* Left Panel - Template Selection */}
          <div className="w-1/2 p-4 border-r border-gray-700 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Choose a Template</h3>
            
            {loading ? (
              <div className="text-gray-400">Loading templates...</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">
                      {category}
                    </h4>
                    <div className="space-y-2 mb-4">
                      {categoryTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedTemplate === template.id
                              ? 'border-blue-500 bg-blue-900/20'
                              : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                          }`}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-white mb-1">{template.name}</h5>
                              <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                              {template.dependencies.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {template.dependencies.slice(0, 3).map((dep, index) => (
                                    <span
                                      key={index}
                                      className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300"
                                    >
                                      {dep.split('>=')[0]}
                                    </span>
                                  ))}
                                  {template.dependencies.length > 3 && (
                                    <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                                      +{template.dependencies.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <input
                              type="radio"
                              name="template"
                              checked={selectedTemplate === template.id}
                              onChange={() => setSelectedTemplate(template.id)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Project Configuration */}
          <div className="w-1/2 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Project Configuration</h3>
              
              {/* Template Preview */}
              {selectedTemplateObj && (
                <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">📋 {selectedTemplateObj.name}</h4>
                  <p className="text-sm text-gray-300 mb-3">{selectedTemplateObj.description}</p>
                  
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Files to be created:</h5>
                    <div className="text-xs text-gray-400 max-h-32 overflow-y-auto">
                      {selectedTemplateObj.files
                        .filter(f => !f.is_directory)
                        .slice(0, 8)
                        .map((file, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span>📄</span>
                            <span>{file.path}</span>
                          </div>
                        ))}
                      {selectedTemplateObj.files.filter(f => !f.is_directory).length > 8 && (
                        <div className="text-gray-500 mt-1">
                          ...and {selectedTemplateObj.files.filter(f => !f.is_directory).length - 8} more files
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedTemplateObj.dependencies.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Dependencies:</h5>
                      <div className="text-xs text-gray-400">
                        {selectedTemplateObj.dependencies.slice(0, 5).join(', ')}
                        {selectedTemplateObj.dependencies.length > 5 && ' ...'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Project Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    disabled={creating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Location</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={projectPath}
                      onChange={(e) => setProjectPath(e.target.value)}
                      placeholder="C:\\Projects"
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      disabled={creating}
                    />
                    <button
                      onClick={async () => {
                        try {
                          const path = await TauriAPI.openProjectDialog()
                          if (path) {
                            setProjectPath(path)
                          }
                        } catch (error) {
                          console.error('Failed to open directory dialog:', error)
                        }
                      }}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
                      disabled={creating}
                    >
                      📁
                    </button>
                  </div>
                  {projectName && projectPath && (
                    <div className="mt-1 text-xs text-gray-400">
                      Full path: {projectPath}/{projectName}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Python Version</label>
                  <select
                    value={pythonVersion}
                    onChange={(e) => setPythonVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    disabled={creating}
                  >
                    <option value="3.8">Python 3.8</option>
                    <option value="3.9">Python 3.9</option>
                    <option value="3.10">Python 3.10</option>
                    <option value="3.11">Python 3.11</option>
                    <option value="3.12">Python 3.12</option>
                    <option value="3.13">Python 3.13</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex gap-3 justify-end p-4 border-t border-gray-700 bg-gray-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            disabled={creating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateProject}
            disabled={!selectedTemplate || !projectName.trim() || !projectPath.trim() || creating}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-2"
          >
            {creating ? (
              <>
                <span className="animate-spin">⏳</span>
                Creating...
              </>
            ) : (
              <>
                🚀 Create Project
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectTemplateDialog