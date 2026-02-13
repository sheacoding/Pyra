/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 DEBUG_OUTPUT_LIMIT, IS_MACOS
 * [POS]: lib/ 的常量定义，被多个模块消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ================================================================
 * 全局常量
 * ================================================================ */

// 调试输出缓冲区上限
export const DEBUG_OUTPUT_LIMIT = 200

// macOS 平台检测（透明标题栏适配）
export const IS_MACOS =
  navigator.platform.toUpperCase().includes('MAC') ||
  navigator.userAgent.toUpperCase().includes('MAC')
