/**
 * [INPUT]: 依赖 react 的 useState/useEffect/useCallback
 * [OUTPUT]: 对外提供 useLocalStorage hook
 * [POS]: hooks/ 的 localStorage 响应式封装，替代散落的 getItem/setItem
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useCallback } from 'react'

/* ================================================================
 * 泛型 localStorage hook
 *
 * - 自动序列化/反序列化
 * - 跨 tab 同步（storage event）
 * - 安全的 try/catch 包裹
 * ================================================================ */

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const nextValue = value instanceof Function ? value(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(nextValue))
        } catch {
          // quota exceeded or unavailable
        }
        return nextValue
      })
    },
    [key],
  )

  // 跨 tab 同步
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      try {
        const newValue = e.newValue ? (JSON.parse(e.newValue) as T) : initialValue
        setStoredValue(newValue)
      } catch {
        // ignore
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key, initialValue])

  return [storedValue, setValue]
}
