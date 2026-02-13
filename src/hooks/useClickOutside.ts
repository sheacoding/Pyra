/**
 * [INPUT]: 依赖 react 的 useEffect/useRef
 * [OUTPUT]: 对外提供 useClickOutside hook
 * [POS]: hooks/ 的点击外部检测，替代 App.tsx + FileTree.tsx 的重复实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useRef, type MutableRefObject } from 'react'

/* ================================================================
 * 点击外部关闭 hook
 *
 * 使用 mousedown 而非 click，与浏览器原生 dropdown 行为一致。
 * ================================================================ */

export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
  active = true,
): MutableRefObject<T | null> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!active) return

    const listener = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [handler, active])

  return ref
}
