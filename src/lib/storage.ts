/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 StorageKeys, loadJSON, saveJSON, removeKey
 * [POS]: lib/ 的 localStorage 集中管理，替代散落在 3+ 文件的 9 处直接调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ================================================================
 * Storage Key 常量 - 防止拼写错误
 * ================================================================ */

export const StorageKeys = {
  SETTINGS: 'pyra-settings',
  LAST_PROJECT: 'pyra-last-project',
  LANGUAGE: 'i18nextLng',
} as const

/* ================================================================
 * 类型安全的 localStorage 读写
 * ================================================================ */

export function loadJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage quota exceeded or unavailable
  }
}

export function loadString(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function saveString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // localStorage quota exceeded or unavailable
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
