// [INPUT]: 依赖 crate::process 的 cmd, cmd_in, exec, exec_check 函数
// [OUTPUT]: 对外提供 check_uv_installed, ensure_uv_installed, list_python_versions,
//           install_python_version, create_venv, check_venv_exists,
//           init_uv_project, sync_uv_project 命令
// [POS]: commands 模块的 UV 工具链管理器，处理 Python 版本和虚拟环境
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

use std::path::Path;
use crate::process;

// ============================================================
// UV 安装检测
// ============================================================

#[tauri::command]
pub async fn check_uv_installed() -> Result<bool, String> {
    let mut c = process::cmd("uv");
    c.arg("--version");
    Ok(process::exec_check(c).await)
}

#[tauri::command]
pub async fn ensure_uv_installed() -> Result<String, String> {
    if check_uv_installed().await.unwrap_or(false) {
        return Ok("uv already installed".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        let mut c = process::cmd("powershell");
        c.args([
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-WindowStyle",
            "Hidden",
            "-Command",
            "try { $p=Join-Path $env:TEMP 'uv_install.ps1'; Invoke-WebRequest -UseBasicParsing https://astral.sh/uv/install.ps1 -OutFile $p; Start-Process -WindowStyle Hidden -FilePath powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File', $p, '-Force' -Wait; exit 0 } catch { exit 1 }",
        ]);
        let output = process::exec_raw(c).await?;
        if !output.status.success() {
            return Err("uv install script failed".to_string());
        }
        return if check_uv_installed().await.unwrap_or(false) {
            Ok("uv installed".to_string())
        } else {
            Err("Failed to install uv".to_string())
        };
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    {
        let mut c = process::cmd("sh");
        c.args(["-c", "curl -fsSL https://astral.sh/uv/install.sh | sh >/dev/null 2>&1"]);
        let output = process::exec_raw(c).await?;
        if !output.status.success() {
            return Err("uv install script failed".to_string());
        }
        if check_uv_installed().await.unwrap_or(false) {
            Ok("uv installed".to_string())
        } else {
            Err("Failed to install uv".to_string())
        }
    }
}

// ============================================================
// Python 版本管理
// ============================================================

#[tauri::command]
pub async fn list_python_versions() -> Result<Vec<String>, String> {
    let mut c = process::cmd("uv");
    c.args(["python", "list"]);
    let output = process::exec_raw(c).await?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let versions: Vec<String> = stdout
            .lines()
            .filter_map(|line| {
                if line.contains("python") {
                    line.split_whitespace().next().map(|s| s.to_string())
                } else {
                    None
                }
            })
            .collect();
        Ok(versions)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn install_python_version(version: String) -> Result<String, String> {
    let mut c = process::cmd("uv");
    c.args(["python", "install", &version]);
    process::exec(c).await
}

// ============================================================
// 虚拟环境管理
// ============================================================

#[tauri::command]
pub async fn create_venv(
    project_path: String,
    python_version: Option<String>,
) -> Result<String, String> {
    let mut c = process::cmd_in("uv", &project_path);
    c.args(["venv", ".venv"]);
    if let Some(ref version) = python_version {
        c.arg(format!("--python={}", version));
    }
    process::exec(c).await
}

#[tauri::command]
pub async fn check_venv_exists(project_path: String) -> bool {
    let venv_path = Path::new(&project_path).join(".venv");
    venv_path.exists() && venv_path.is_dir()
}

// ============================================================
// UV 项目管理
// ============================================================

#[tauri::command]
pub async fn init_uv_project(
    project_path: String,
    project_name: String,
    python_version: Option<String>,
) -> Result<String, String> {
    let mut c = process::cmd_in("uv", &project_path);
    c.args(["init", "--name", &project_name]);
    if let Some(ref version) = python_version {
        c.args(["--python", version]);
    }
    process::exec(c).await
}

#[tauri::command]
pub async fn sync_uv_project(project_path: String) -> Result<String, String> {
    let mut c = process::cmd_in("uv", &project_path);
    c.arg("sync");
    process::exec(c).await
}
