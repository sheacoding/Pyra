/**
 * [INPUT]: 依赖 react 的 useEffect, @tauri-apps/api/event 的 listen
 * [OUTPUT]: 对外提供 useTauriEvent hook
 * [POS]: hooks/ 的 Tauri 事件监听封装，自动清理 unlisten
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect } from 'react'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

/* ================================================================
 * Tauri 事件监听 hook
 *
 * 封装 listen() 的异步注册 + 组件卸载自动 cleanup 模式，
 * 消除每个组件重复写 setupListeners/unlisten 的样板代码。
 * ================================================================ */

export function useTauriEvent<T>(
  event: string,
  handler: (payload: T) => void,
  deps: React.DependencyList = [],
): void {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined
    let cancelled = false

    listen<T>(event, (e) => {
      if (!cancelled) {
        handler(e.payload)
      }
    }).then((fn) => {
      if (cancelled) {
        fn()
      } else {
        unlisten = fn
      }
    })

    return () => {
      cancelled = true
      unlisten?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps])
}
