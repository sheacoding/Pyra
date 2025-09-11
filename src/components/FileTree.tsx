import { useState, useEffect } from 'react'
import { TauriAPI, FileItem } from '../lib/tauri'

interface FileTreeProps {
  projectPath: string
  onFileSelect: (filePath: string) => void
}

export function FileTree({ projectPath, onFileSelect }: FileTreeProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  useEffect(() => {
    if (!projectPath) return

    const loadFiles = async () => {
      setLoading(true)
      try {
        const fileList = await TauriAPI.listDirectory(projectPath)
        setFiles(fileList)
      } catch (error) {
        console.error('Failed to load directory:', error)
        setFiles([])
      } finally {
        setLoading(false)
      }
    }

    loadFiles()
  }, [projectPath])

  const handleFileClick = (filePath: string) => {
    setSelectedFile(filePath)
    onFileSelect(filePath)
  }

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return '📁'
    
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'py': return '🐍'
      case 'js': return '📜'
      case 'ts': return '📘'
      case 'json': return '📋'
      case 'md': return '📝'
      case 'txt': return '📄'
      case 'toml': return '⚙️'
      case 'yml':
      case 'yaml': return '📝'
      default: return '📄'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 10) / 10 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="p-4 text-gray-400">
        Loading files...
      </div>
    )
  }

  if (!projectPath) {
    return (
      <div className="p-4 text-gray-400">
        <div className="text-sm mb-4">No project selected</div>
        <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded">
          Open Project
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <div className="text-sm font-semibold text-gray-300">Explorer</div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-4 text-gray-400 text-sm">
            No files in project
          </div>
        ) : (
          <div className="p-2">
            {files.map((file, index) => (
              <div
                key={index}
                className={`flex items-center justify-between gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-gray-700 rounded ${
                  selectedFile === file.path ? 'bg-gray-700' : ''
                }`}
                onClick={() => !file.is_directory && handleFileClick(file.path)}
                title={`${file.name}${file.size ? ` (${formatFileSize(file.size)})` : ''}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-base flex-shrink-0">
                    {getFileIcon(file.name, file.is_directory)}
                  </span>
                  <span className="text-gray-300 truncate">
                    {file.name}
                  </span>
                </div>
                {file.size && (
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}