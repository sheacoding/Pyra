/**
 * [INPUT]: 依赖 react, ../lib/storage
 * [OUTPUT]: 对外提供 ProjectProvider, useProject hook
 * [POS]: contexts/ 的项目状态管理，替代 App.tsx 的 projectPath/currentFile/openTabs prop drilling
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { StorageKeys, loadString, saveString, removeKey } from '../lib/storage'

/* ================================================================
 * Context 接口
 * ================================================================ */

interface ProjectContextValue {
  projectPath: string
  currentFile: string | null
  openTabs: string[]
  setProjectPath: (path: string) => void
  setCurrentFile: (path: string | null) => void
  openFileInTab: (path: string) => void
  closeTab: (path: string) => void
  selectTab: (path: string) => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

/* ================================================================
 * Provider
 * ================================================================ */

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectPath, setProjectPathState] = useState<string>(() => {
    return loadString(StorageKeys.LAST_PROJECT) ?? ''
  })
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [openTabs, setOpenTabs] = useState<string[]>([])

  // 持久化项目路径
  useEffect(() => {
    if (projectPath) {
      saveString(StorageKeys.LAST_PROJECT, projectPath)
    } else {
      removeKey(StorageKeys.LAST_PROJECT)
    }
  }, [projectPath])

  const setProjectPath = useCallback((path: string) => {
    setProjectPathState(path)
    setCurrentFile(null)
    setOpenTabs([])
  }, [])

  const openFileInTab = useCallback((path: string) => {
    setOpenTabs(prev => (prev.includes(path) ? prev : [...prev, path]))
    setCurrentFile(path)
  }, [])

  const closeTab = useCallback((path: string) => {
    setOpenTabs(prev => {
      const remaining = prev.filter(p => p !== path)
      return remaining
    })
    setCurrentFile(prev => {
      if (prev !== path) return prev
      // 选择相邻 tab
      setOpenTabs(currentTabs => {
        const remaining = currentTabs.filter(p => p !== path)
        if (remaining.length === 0) {
          setCurrentFile(null)
        } else {
          const idx = currentTabs.indexOf(path)
          const nextIdx = Math.max(0, Math.min(idx - 1, remaining.length - 1))
          setCurrentFile(remaining[nextIdx])
        }
        return remaining
      })
      return prev
    })
  }, [])

  const selectTab = useCallback((path: string) => {
    setCurrentFile(path)
  }, [])

  return (
    <ProjectContext.Provider
      value={{
        projectPath,
        currentFile,
        openTabs,
        setProjectPath,
        setCurrentFile,
        openFileInTab,
        closeTab,
        selectTab,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

/* ================================================================
 * Consumer hook
 * ================================================================ */

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext)
  if (!ctx) {
    throw new Error('useProject must be used within ProjectProvider')
  }
  return ctx
}
