// [INPUT]: 依赖 crate::process 的 cmd_in, exec, exec_raw 函数，依赖 serde_json 解析
// [OUTPUT]: 对外提供 check_ruff_installed, install_ruff_with_uv, ruff_check_file,
//           ruff_check_project, ruff_format_file, ruff_format_project, ruff_fix_file,
//           create_ruff_config 命令
// [POS]: commands 模块的代码质量工具，处理 Ruff lint/format 操作
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

use serde::{Deserialize, Serialize};
use crate::process;

// ============================================================
// 数据类型
// ============================================================

#[derive(Serialize, Deserialize)]
pub struct RuffDiagnostic {
    pub rule: String,
    pub message: String,
    pub line: u32,
    pub column: u32,
    pub end_line: u32,
    pub end_column: u32,
    pub severity: String,
    pub filename: String,
}

#[derive(Serialize, Deserialize)]
pub struct RuffCheckResult {
    pub diagnostics: Vec<RuffDiagnostic>,
    pub fixed: u32,
    pub errors: Vec<String>,
}

// ============================================================
// Ruff 安装管理
// ============================================================

#[tauri::command]
pub async fn check_ruff_installed() -> Result<bool, String> {
    let mut c = process::cmd("uv");
    c.args(["run", "ruff", "--version"]);
    Ok(process::exec_check(c).await)
}

#[tauri::command]
pub async fn install_ruff_with_uv(project_path: String) -> Result<String, String> {
    let mut c = process::cmd_in("uv", &project_path);
    c.args(["add", "--dev", "ruff"]);
    process::exec(c).await
}

// ============================================================
// 代码检查
// ============================================================

#[tauri::command]
pub async fn ruff_check_file(
    project_path: String,
    file_path: String,
) -> Result<RuffCheckResult, String> {
    let mut c = process::cmd_in("uv", &project_path);
    c.args(["run", "ruff", "check", &file_path, "--output-format=json", "--no-cache"]);
    let output = process::exec_raw(c).await?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    Ok(build_check_result(&stdout, &stderr, &file_path, 0))
}

#[tauri::command]
pub async fn ruff_check_project(project_path: String) -> Result<RuffCheckResult, String> {
    let mut c = process::cmd_in("uv", &project_path);
    c.args(["run", "ruff", "check", ".", "--output-format=json", "--no-cache"]);
    let output = process::exec_raw(c).await?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if !output.status.success() && stderr.trim().is_empty() {
        return Err(stderr.to_string());
    }
    Ok(build_check_result(&stdout, &stderr, ".", 0))
}

#[tauri::command]
pub async fn ruff_fix_file(
    project_path: String,
    file_path: String,
) -> Result<RuffCheckResult, String> {
    let mut c = process::cmd_in("uv", &project_path);
    c.args(["run", "ruff", "check", &file_path, "--fix", "--output-format=json", "--no-cache"]);
    let output = process::exec_raw(c).await?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let fixed_count = stderr.matches("fixed").count() as u32;

    if !output.status.success() && stderr.trim().is_empty() {
        return Err(stderr.to_string());
    }
    Ok(build_check_result(&stdout, &stderr, &file_path, fixed_count))
}

// ============================================================
// 格式化
// ============================================================

#[tauri::command]
pub async fn ruff_format_file(project_path: String, file_path: String) -> Result<String, String> {
    let mut c = process::cmd_in("uv", &project_path);
    c.args(["run", "ruff", "format", &file_path, "--no-cache"]);
    process::exec(c).await
}

#[tauri::command]
pub async fn ruff_format_project(project_path: String) -> Result<String, String> {
    let mut c = process::cmd_in("uv", &project_path);
    c.args(["run", "ruff", "format", ".", "--no-cache"]);
    let output = process::exec_raw(c).await?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        Ok(format!("{}{}", stdout, stderr))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// ============================================================
// Ruff 配置生成
// ============================================================

#[tauri::command]
pub async fn create_ruff_config(project_path: String) -> Result<String, String> {
    let config_content = include_str!("ruff_config.toml");
    let config_path = std::path::Path::new(&project_path).join("pyproject.toml");

    if config_path.exists() {
        let existing = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read pyproject.toml: {}", e))?;

        if existing.contains("[tool.ruff]") {
            return Ok("Ruff configuration already exists in pyproject.toml".to_string());
        }

        let new_content = format!("{}\n\n{}", existing, config_content);
        std::fs::write(&config_path, new_content)
            .map_err(|e| format!("Failed to write pyproject.toml: {}", e))?;
        Ok("Ruff configuration added to existing pyproject.toml".to_string())
    } else {
        std::fs::write(&config_path, config_content)
            .map_err(|e| format!("Failed to create pyproject.toml: {}", e))?;
        Ok("Created pyproject.toml with Ruff configuration".to_string())
    }
}

// ============================================================
// 解析器 —— 统一的 JSON 诊断解析 + 结果构建
// ============================================================

/// 解析 ruff JSON 输出为诊断列表
fn parse_ruff_diagnostics(json_str: &str, default_filename: &str) -> Vec<RuffDiagnostic> {
    let json_diagnostics: Vec<serde_json::Value> = match serde_json::from_str(json_str) {
        Ok(v) => v,
        Err(_) => return vec![],
    };

    json_diagnostics
        .iter()
        .filter_map(|diag| {
            let code = diag.get("code")?.as_str()?;
            let message = diag.get("message")?.as_str()?;
            let location = diag.get("location")?;
            let row = location.get("row")?.as_u64()?;
            let column = location.get("column")?.as_u64()?;

            let (end_row, end_column) = diag
                .get("end_location")
                .map(|end| {
                    (
                        end.get("row").and_then(|r| r.as_u64()).unwrap_or(row),
                        end.get("column").and_then(|c| c.as_u64()).unwrap_or(column + 1),
                    )
                })
                .unwrap_or((row, column + 1));

            let filename = diag
                .get("filename")
                .and_then(|f| f.as_str())
                .unwrap_or(default_filename);

            Some(RuffDiagnostic {
                rule: code.to_string(),
                message: message.to_string(),
                line: row as u32,
                column: column as u32,
                end_line: end_row as u32,
                end_column: end_column as u32,
                severity: "warning".to_string(),
                filename: filename.to_string(),
            })
        })
        .collect()
}

/// 构建标准化的检查结果
fn build_check_result(stdout: &str, stderr: &str, default_filename: &str, fixed: u32) -> RuffCheckResult {
    let diagnostics = if stdout.trim().is_empty() {
        vec![]
    } else {
        parse_ruff_diagnostics(stdout, default_filename)
    };

    let errors = if stderr.trim().is_empty() || (fixed > 0 && stderr.contains("fixed")) {
        vec![]
    } else {
        vec![stderr.to_string()]
    };

    RuffCheckResult {
        diagnostics,
        fixed,
        errors,
    }
}
