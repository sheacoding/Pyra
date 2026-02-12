// [INPUT]: 依赖 tokio::process, std::process::Output
// [OUTPUT]: 对外提供 cmd, cmd_in, exec, exec_check, exec_raw, std_cmd, std_cmd_in 函数
// [POS]: 跨平台进程执行抽象层，消除所有 #[cfg(windows)] 重复
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

use std::process::Output;
use tokio::process::Command;

// ============================================================
// Windows CREATE_NO_WINDOW 常量
// ============================================================

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

// ============================================================
// 命令构建器 —— 自动配置 stdio 和平台标志
// ============================================================

/// 构建命令，自动配置 stdin/stdout/stderr + Windows 隐藏窗口
pub fn cmd(program: &str) -> Command {
    let mut c = Command::new(program);
    c.stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
    #[cfg(target_os = "windows")]
    {
        c.creation_flags(CREATE_NO_WINDOW);
    }
    c
}

/// 构建命令，带工作目录
pub fn cmd_in(program: &str, cwd: &str) -> Command {
    let mut c = cmd(program);
    c.current_dir(cwd);
    c
}

// ============================================================
// 执行器 —— 统一的进程运行接口
// ============================================================

/// 执行命令，返回 stdout 字符串
pub async fn exec(mut command: Command) -> Result<String, String> {
    let output = command.output().await
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// 执行命令，仅检查是否成功
pub async fn exec_check(mut command: Command) -> bool {
    command.output().await
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// 执行命令，返回原始 Output
pub async fn exec_raw(mut command: Command) -> Result<Output, String> {
    command.output().await
        .map_err(|e| format!("Failed to execute command: {}", e))
}

// ============================================================
// std::process 命令构建器 —— 用于需要 std::process::Child 的流式场景
// ============================================================

/// 构建 std::process::Command，自动配置 stdio + Windows 隐藏窗口
pub fn std_cmd(program: &str) -> std::process::Command {
    let mut c = std::process::Command::new(program);
    c.stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        c.creation_flags(CREATE_NO_WINDOW);
    }
    c
}

/// 构建 std::process::Command，带工作目录
pub fn std_cmd_in(program: &str, cwd: &str) -> std::process::Command {
    let mut c = std_cmd(program);
    c.current_dir(cwd);
    c
}
