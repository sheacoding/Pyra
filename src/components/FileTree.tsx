import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { TauriAPI, FileItem } from '../lib/tauri'

interface FileTreeProps {
  projectPath: string
  onFileSelect: (filePath: string) => void
}

export interface FileTreeHandle {
  openNewFileDialog: () => void
  openNewFolderDialog: () => void
  refresh: () => void
}

interface ContextMenu {
  x: number
  y: number
  targetPath: string
  isDirectory: boolean
}

export const FileTree = forwardRef<FileTreeHandle, FileTreeProps>(function FileTree({ projectPath, onFileSelect }: FileTreeProps, ref) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([projectPath]))
  const [folderContents, setFolderContents] = useState<Map<string, FileItem[]>>(new Map())
  const [contextMenuData, setContextMenuData] = useState<{path: string, isDirectory: boolean} | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    openNewFileDialog: () => {
      setContextMenuData({ path: projectPath, isDirectory: true })
      setShowNewFileDialog(true)
    },
    openNewFolderDialog: () => {
      setContextMenuData({ path: projectPath, isDirectory: true })
      setShowNewFolderDialog(true)
    },
    refresh: () => { refreshFiles() }
  }), [projectPath, files, expandedFolders])

  useEffect(() => {
    if (!projectPath) return

    const loadFiles = async () => {
      setLoading(true)
      try {
        const fileList = await TauriAPI.listDirectory(projectPath)
        setFiles(fileList)
        // Store root folder contents
        setFolderContents(prev => new Map(prev.set(projectPath, fileList)))
      } catch (error) {
        console.error('Failed to load directory:', error)
        setFiles([])
      } finally {
        setLoading(false)
      }
    }

    loadFiles()
  }, [projectPath])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu])

  const loadFolderContents = async (folderPath: string) => {
    try {
      const fileList = await TauriAPI.listDirectory(folderPath)
      setFolderContents(prev => new Map(prev.set(folderPath, fileList)))
    } catch (error) {
      console.error('Failed to load folder contents:', error)
    }
  }

  const toggleFolder = async (folderPath: string) => {
    const newExpandedFolders = new Set(expandedFolders)
    
    if (expandedFolders.has(folderPath)) {
      // Collapse folder
      newExpandedFolders.delete(folderPath)
    } else {
      // Expand folder
      newExpandedFolders.add(folderPath)
      // Load folder contents if not already loaded
      if (!folderContents.has(folderPath)) {
        await loadFolderContents(folderPath)
      }
    }
    
    setExpandedFolders(newExpandedFolders)
  }

  const refreshFiles = async () => {
    try {
      const fileList = await TauriAPI.listDirectory(projectPath)
      setFiles(fileList)
      setFolderContents(new Map([[projectPath, fileList]]))
      
      // Refresh expanded folders
      for (const folderPath of expandedFolders) {
        if (folderPath !== projectPath) {
          await loadFolderContents(folderPath)
        }
      }
    } catch (error) {
      console.error('Failed to refresh files:', error)
    }
  }

  const handleFileClick = (filePath: string) => {
    setSelectedFile(filePath)
    onFileSelect(filePath)
  }

  const handleRightClick = (event: React.MouseEvent, file: FileItem) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      targetPath: file.path,
      isDirectory: file.is_directory
    })
  }

  const handleCreateNewFile = () => {
    setContextMenuData(contextMenu ? {path: contextMenu.targetPath, isDirectory: contextMenu.isDirectory} : null)
    setShowNewFileDialog(true)
    setContextMenu(null)
  }

  const handleCreateNewFolder = () => {
    setContextMenuData(contextMenu ? {path: contextMenu.targetPath, isDirectory: contextMenu.isDirectory} : null)
    setShowNewFolderDialog(true)
    setContextMenu(null)
  }

  const handleDeleteFile = async (filePath: string) => {
    const fileName = filePath.split(/[/\\]/).pop() || 'this file'
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      try {
        await TauriAPI.deleteFile(filePath)
        await refreshFiles()
        // If the deleted file was selected, clear selection
        if (selectedFile === filePath) {
          setSelectedFile(null)
        }
      } catch (error) {
        console.error('Failed to delete file:', error)
        alert('Failed to delete file: ' + error)
      }
    }
    setContextMenu(null)
  }

  const confirmCreateFile = async () => {
    if (!newFileName.trim()) return

    try {
      // Determine the target directory based on context menu data
      let targetDir = projectPath
      if (contextMenuData) {
        if (contextMenuData.isDirectory) {
          targetDir = contextMenuData.path
        } else {
          // If right-clicked on a file, use its parent directory
          targetDir = contextMenuData.path.replace(/[/\\][^/\\]*$/, '')
        }
      }
      
      const filePath = `${targetDir}/${newFileName.trim()}`
      await TauriAPI.createFile(filePath)
      await refreshFiles()
      
      // If we created in a subfolder, make sure it's expanded
      if (targetDir !== projectPath) {
        setExpandedFolders(prev => new Set(prev.add(targetDir)))
        // Also refresh the target directory contents
        await loadFolderContents(targetDir)
      }
      
      setShowNewFileDialog(false)
      setNewFileName('')
      setContextMenuData(null)
    } catch (error) {
      console.error('Failed to create file:', error)
      alert('Failed to create file: ' + error)
    }
  }

  const confirmCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      // Determine the target directory based on context menu data
      let targetDir = projectPath
      if (contextMenuData) {
        if (contextMenuData.isDirectory) {
          targetDir = contextMenuData.path
        } else {
          // If right-clicked on a file, use its parent directory
          targetDir = contextMenuData.path.replace(/[/\\][^/\\]*$/, '')
        }
      }
      
      const folderPath = `${targetDir}/${newFolderName.trim()}`
      await TauriAPI.createDirectory(folderPath)
      await refreshFiles()
      
      // If we created in a subfolder, make sure it's expanded
      if (targetDir !== projectPath) {
        setExpandedFolders(prev => new Set(prev.add(targetDir)))
        // Also refresh the target directory contents
        await loadFolderContents(targetDir)
      }
      
      setShowNewFolderDialog(false)
      setNewFolderName('')
      setContextMenuData(null)
    } catch (error) {
      console.error('Failed to create folder:', error)
      alert('Failed to create folder: ' + error)
    }
  }

  const getFileIcon = (fileName: string, isDirectory: boolean, isExpanded?: boolean) => {
    if (isDirectory) {
      return isExpanded ? '📂' : '📁'
    }
    
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

  const renderFileItem = (file: FileItem, depth: number = 0) => {
    const isExpanded = expandedFolders.has(file.path)
    const children = file.is_directory && isExpanded ? folderContents.get(file.path) || [] : []
    
    return (
      <div key={file.path}>
        <div
          className="flex items-center justify-between gap-2 px-2 py-1 text-sm cursor-pointer rounded transition-colors"
          style={{
            marginLeft: `${depth * 16}px`,
            backgroundColor: selectedFile === file.path ? 'var(--ctp-surface2)' : 'transparent',
            color: selectedFile === file.path ? 'var(--ctp-text)' : 'var(--ctp-subtext1)'
          }}
          onMouseEnter={(e) => {
            if (selectedFile !== file.path) {
              e.currentTarget.style.backgroundColor = 'var(--ctp-surface0)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedFile !== file.path) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
          onClick={() => {
            if (file.is_directory) {
              toggleFolder(file.path)
            } else {
              handleFileClick(file.path)
            }
          }}
          onContextMenu={(e) => handleRightClick(e, file)}
          title={`${file.name}${file.size ? ` (${formatFileSize(file.size)})` : ''}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {file.is_directory && (
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--ctp-overlay0)' }}>
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            <span className="text-base flex-shrink-0">
              {getFileIcon(file.name, file.is_directory, isExpanded)}
            </span>
            <span className="truncate" style={{ color: selectedFile === file.path ? 'var(--ctp-text)' : 'var(--ctp-subtext1)' }}>
              {file.name}
            </span>
          </div>
          {file.size && (
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--ctp-overlay0)' }}>
              {formatFileSize(file.size)}
            </span>
          )}
        </div>
        
        {/* Render children if folder is expanded */}
        {file.is_directory && isExpanded && children.length > 0 && (
          <div>
            {children.map((childFile) => renderFileItem(childFile, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 10) / 10 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="p-4" style={{ color: 'var(--ctp-overlay0)' }}>
        Loading files...
      </div>
    )
  }

  if (!projectPath) {
    return (
      <div className="p-4" style={{ color: 'var(--ctp-overlay0)' }}>
        <div className="text-sm mb-4" style={{ color: 'var(--ctp-subtext1)' }}>No project selected</div>
        <button className="px-3 py-1 text-sm rounded font-medium transition-colors"
          style={{
            backgroundColor: 'var(--ctp-mauve)',
            color: 'var(--ctp-base)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--ctp-lavender)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--ctp-mauve)'
          }}>
          Open Project
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-4 text-gray-400 text-sm">
            No files in project
          </div>
        ) : (
          <div className="p-2">
            {files.map((file) => renderFileItem(file))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => { refreshFiles(); setContextMenu(null) }}
            className="w-full text-left px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleCreateNewFile}
            className="w-full text-left px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            📄 New File
          </button>
          <button
            onClick={handleCreateNewFolder}
            className="w-full text-left px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            📁 New Folder
          </button>
          <div className="border-t border-gray-600 my-1"></div>
          <button
            onClick={() => handleDeleteFile(contextMenu.targetPath)}
            className="w-full text-left px-3 py-1 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-80">
            <h3 className="text-lg font-semibold text-white mb-4">Create New File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Enter file name (e.g., script.py)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmCreateFile()
                if (e.key === 'Escape') {
                  setShowNewFileDialog(false)
                  setNewFileName('')
                  setContextMenuData(null)
                }
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowNewFileDialog(false)
                  setNewFileName('')
                  setContextMenuData(null)
                }}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmCreateFile}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-80">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmCreateFolder()
                if (e.key === 'Escape') {
                  setShowNewFolderDialog(false)
                  setNewFolderName('')
                  setContextMenuData(null)
                }
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowNewFolderDialog(false)
                  setNewFolderName('')
                  setContextMenuData(null)
                }}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmCreateFolder}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
