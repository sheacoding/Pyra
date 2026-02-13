/**
 * [INPUT]: 依赖 react 的 useEffect, @tauri-apps/api/window
 * [OUTPUT]: 对外提供 useWindowInit hook
 * [POS]: hooks/ 的 Tauri 窗口初始化，从 App.tsx L361-414 提取
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect } from 'react'
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'

/* ================================================================
 * 窗口初始化 hook
 *
 * 确保生产环境下窗口可见且尺寸正确。
 * ================================================================ */

export function useWindowInit(): void {
  // 确保窗口可见和尺寸正确
  useEffect(() => {
    const initializeWindow = async () => {
      try {
        const appWindow = getCurrentWindow()

        const isVisible = await appWindow.isVisible()
        if (!isVisible) {
          await appWindow.show()
        }

        const size = await appWindow.innerSize()
        if (size.width < 800 || size.height < 600) {
          await appWindow.setSize(new LogicalSize(1200, 800))
          await appWindow.center()
        }
      } catch {
        // Tauri 未完全初始化
      }
    }

    const timer = setTimeout(initializeWindow, 100)
    return () => clearTimeout(timer)
  }, [])

  // 监控窗口最大化状态
  useEffect(() => {
    const checkWindowState = async () => {
      try {
        const appWindow = getCurrentWindow()
        await appWindow.isMaximized()
      } catch {
        // ignore
      }
    }

    checkWindowState()

    const handleResize = () => { checkWindowState() }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
}
