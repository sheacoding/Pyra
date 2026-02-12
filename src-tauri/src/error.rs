// [INPUT]: 依赖 std::io, serde_json, anyhow 的错误类型
// [OUTPUT]: 对外提供 AppError, ErrorKind, AppResult 类型
// [POS]: 全局统一错误类型，被所有 commands 模块消费
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

use std::fmt;

// ============================================================
// 错误分类 —— 按问题域划分，而非按底层异常类型
// ============================================================

#[derive(Debug)]
pub enum ErrorKind {
    Io,
    Json,
    Process,
    NotFound,
    Config,
}

// ============================================================
// 统一错误类型 —— 所有 Tauri command 的唯一出口
// ============================================================

#[derive(Debug)]
pub struct AppError {
    pub kind: ErrorKind,
    pub message: String,
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

// ============================================================
// From 转换 —— 让 ? 运算符自动桥接底层错误
// ============================================================

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        Self { kind: ErrorKind::Io, message: e.to_string() }
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        Self { kind: ErrorKind::Json, message: e.to_string() }
    }
}

impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        Self { kind: ErrorKind::Process, message: e.to_string() }
    }
}

// ============================================================
// Into<String> —— Tauri command 消费接口
// ============================================================

impl From<AppError> for String {
    fn from(e: AppError) -> Self {
        e.message
    }
}
