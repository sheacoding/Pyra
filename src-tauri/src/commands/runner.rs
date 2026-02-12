// [INPUT]: 依赖 crate::process 的 cmd_in, exec_raw, std_cmd_in 函数，
//          依赖 tauri 的 Window/State/Emitter，依赖 tokio 异步运行时
// [OUTPUT]: 对外提供 ProcessManager 类型, create_process_manager 工厂,
//           run_script, run_script_simple, run_script_with_uv,
//           run_script_with_output_streaming, run_script_with_uv_streaming,
//           stop_running_script 命令
// [POS]: commands 模块的脚本执行引擎，处理同步/流式 Python 脚本运行
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

use std::path::Path;
use std::process::Child;
use std::sync::Arc;
use tauri::{Emitter, State, Window};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::Mutex;
use crate::process;

// ============================================================
// 进程管理器 —— 全局单例，追踪当前运行的脚本进程
// ============================================================

pub type ProcessManager = Arc<Mutex<Option<Child>>>;

pub fn create_process_manager() -> ProcessManager {
    Arc::new(Mutex::new(None))
}

// ============================================================
// Python 可执行文件路径解析
// ============================================================

fn python_exe(project_path: &str) -> String {
    if cfg!(target_os = "windows") {
        format!("{}/.venv/Scripts/python.exe", project_path)
    } else {
        format!("{}/.venv/bin/python", project_path)
    }
}

/// 确定实际可用的 Python 程序路径
fn resolve_python(project_path: &str) -> String {
    let exe = python_exe(project_path);
    if Path::new(&exe).exists() { exe } else { "python".to_string() }
}

// ============================================================
// 简单执行命令 —— 无流式输出
// ============================================================

#[tauri::command]
pub async fn run_script(project_path: String, script_path: String) -> Result<String, String> {
    let exe = python_exe(&project_path);
    let mut c = process::cmd_in(&exe, &project_path);
    c.arg(&script_path);
    let output = process::exec_raw(c).await?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    Ok(format!("{}{}", stdout, stderr))
}

#[tauri::command]
pub async fn run_script_simple(
    project_path: String,
    script_path: String,
) -> Result<String, String> {
    let exe = resolve_python(&project_path);
    let mut c = process::cmd_in(&exe, &project_path);
    c.arg(&script_path);
    let output = process::exec_raw(c).await?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    Ok(format!("{}{}", stdout, stderr))
}

#[tauri::command]
pub async fn run_script_with_uv(
    project_path: String,
    script_path: String,
) -> Result<String, String> {
    let mut c = process::cmd_in("uv", &project_path);
    c.args(["run", "python", &script_path]);
    let output = process::exec_raw(c).await?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    Ok(format!("{}{}", stdout, stderr))
}

// ============================================================
// 流式执行 —— 统一的 streaming 内核，消除 240 行重复
// ============================================================

/// 流式执行内核：spawn 子进程 → 实时转发 stdout/stderr → 监控退出
async fn stream_execution(
    window: Window,
    mut child: Child,
    process_manager: Arc<Mutex<Option<Child>>>,
) -> Result<String, String> {
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    // 存入进程管理器
    {
        let mut current = process_manager.lock().await;
        *current = Some(child);
    }

    // stdout 转发
    let w_out = window.clone();
    let stdout_handle = tokio::spawn(async move {
        let reader = BufReader::new(tokio::process::ChildStdout::from_std(stdout).unwrap());
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = w_out.emit("script-output", &format!("{}\n", line));
        }
    });

    // stderr 转发
    let w_err = window.clone();
    let stderr_handle = tokio::spawn(async move {
        let reader = BufReader::new(tokio::process::ChildStderr::from_std(stderr).unwrap());
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = w_err.emit("script-error", &format!("{}\n", line));
        }
    });

    // 监控进程退出
    let pm_wait = Arc::clone(&process_manager);
    let w_done = window.clone();
    tokio::spawn(async move {
        loop {
            let should_continue = {
                let mut current = pm_wait.lock().await;
                if let Some(ref mut child) = *current {
                    match child.try_wait() {
                        Ok(Some(status)) => {
                            *current = None;
                            let _ = w_done.emit("script-completed", status.success());
                            break;
                        }
                        Ok(None) => true,
                        Err(_) => {
                            *current = None;
                            let _ = w_done.emit("script-completed", false);
                            break;
                        }
                    }
                } else {
                    let _ = w_done.emit("script-completed", false);
                    break;
                }
            };

            if !should_continue {
                break;
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }

        let _ = stdout_handle.await;
        let _ = stderr_handle.await;
    });

    Ok("Script started successfully".to_string())
}

// ============================================================
// 流式执行命令 —— 两个入口，共享 stream_execution 内核
// ============================================================

#[tauri::command]
pub async fn run_script_with_output_streaming(
    window: Window,
    project_path: String,
    script_path: String,
    process_manager: State<'_, ProcessManager>,
) -> Result<String, String> {
    // 杀掉上一个进程
    kill_current_process(&process_manager).await;

    let exe = resolve_python(&project_path);
    let mut cmd = process::std_cmd_in(&exe, &project_path);
    cmd.arg(&script_path);
    let child = cmd.spawn()
        .map_err(|e| format!("Failed to start Python script: {}", e))?;

    stream_execution(window, child, Arc::clone(&*process_manager)).await
}

#[tauri::command]
pub async fn run_script_with_uv_streaming(
    window: Window,
    project_path: String,
    script_path: String,
    process_manager: State<'_, ProcessManager>,
) -> Result<String, String> {
    // 杀掉上一个进程
    kill_current_process(&process_manager).await;

    let mut cmd = process::std_cmd_in("uv", &project_path);
    cmd.args(["run", "python", &script_path]);
    let child = cmd.spawn()
        .map_err(|e| format!("Failed to start uv run: {}", e))?;

    stream_execution(window, child, Arc::clone(&*process_manager)).await
}

// ============================================================
// 停止脚本
// ============================================================

#[tauri::command]
pub async fn stop_running_script(
    process_manager: State<'_, ProcessManager>,
) -> Result<String, String> {
    let mut current = process_manager.lock().await;
    if let Some(mut child) = current.take() {
        let pid = child.id();
        let _ = child.kill();
        let _ = child.wait();

        // 平台特定的子进程清理
        #[cfg(unix)]
        {
            let _ = std::process::Command::new("pkill")
                .args(["-P", &pid.to_string()])
                .output();
        }
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            let mut c1 = std::process::Command::new("taskkill");
            c1.args(["/F", "/IM", "uv.exe"])
                .stdin(std::process::Stdio::null())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .creation_flags(0x08000000);
            let _ = c1.output();

            let mut c2 = std::process::Command::new("taskkill");
            c2.args(["/F", "/IM", "python.exe"])
                .stdin(std::process::Stdio::null())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .creation_flags(0x08000000);
            let _ = c2.output();
        }

        Ok("Script stopped successfully".to_string())
    } else {
        Ok("No script is currently running".to_string())
    }
}

// ============================================================
// 内部辅助
// ============================================================

async fn kill_current_process(pm: &ProcessManager) {
    let mut current = pm.lock().await;
    if let Some(mut child) = current.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
}
