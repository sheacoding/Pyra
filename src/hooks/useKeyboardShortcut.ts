/**
 * [INPUT]: 依赖 react 的 useEffect
 * [OUTPUT]: 对外提供 useKeyboardShortcut hook
 * [POS]: hooks/ 的键盘快捷键注册，统一管理全局按键
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect } from 'react'

/* ================================================================
 * 键盘快捷键描述符
 * ================================================================ */

interface ShortcutDescriptor {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: (e: KeyboardEvent) => void
}

/* ================================================================
 * 键盘快捷键 hook
 *
 * 注册一组快捷键，组件卸载自动清理。
 * ================================================================ */

export function useKeyboardShortcut(
  shortcuts: ShortcutDescriptor[],
  active = true,
): void {
  useEffect(() => {
    if (!active || shortcuts.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.alt ? e.altKey : !e.altKey

        if (e.key === shortcut.key && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault()
          shortcut.handler(e)
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, active])
}
