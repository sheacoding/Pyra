use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

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

#[tauri::command]
pub async fn check_ruff_installed() -> Result<bool, String> {
    let mut cmd = Command::new("uv");
    cmd.args(&["run", "ruff", "--version"]) 
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(target_os = "windows")]
    {
        // CREATE_NO_WINDOW to avoid flashing console windows in release
        cmd.creation_flags(0x08000000);
    }
    let output = cmd.output();

    match output {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn install_ruff_with_uv(project_path: String) -> Result<String, String> {
    let mut cmd = Command::new("uv");
    cmd.args(&["add", "--dev", "ruff"]) 
        .current_dir(&project_path)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(target_os = "windows")]
    {
        cmd.creation_flags(0x08000000);
    }
    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute uv: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn ruff_check_file(
    project_path: String,
    file_path: String,
) -> Result<RuffCheckResult, String> {
    println!("🔍 [RUFF] Starting ruff_check_file");
    println!("🔍 [RUFF] project_path: {}", project_path);
    println!("🔍 [RUFF] file_path: {}", file_path);

    let mut cmd = Command::new("uv");
    cmd.args(&[
            "run",
            "ruff",
            "check",
            &file_path,
            "--output-format=json",
            "--no-cache",
        ])
        .current_dir(&project_path)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(target_os = "windows")]
    {
        cmd.creation_flags(0x08000000);
    }
    let output = cmd.output()
        .map_err(|e| {
            let error_msg = format!("Failed to execute uv run ruff check: {}", e);
            println!("❌ [RUFF] {}", error_msg);
            error_msg
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    println!("🔍 [RUFF] Command output status: {}", output.status);
    println!("🔍 [RUFF] stdout length: {}", stdout.len());
    println!("🔍 [RUFF] stderr length: {}", stderr.len());
    if !stdout.is_empty() {
        println!("🔍 [RUFF] stdout: {}", stdout);
    }
    if !stderr.is_empty() {
        println!("🔍 [RUFF] stderr: {}", stderr);
    }

    // Always try to parse output, whether success or not
    // Ruff returns non-zero exit code when issues are found, but still provides valid JSON
    if !stdout.trim().is_empty() {
        match serde_json::from_str::<Vec<serde_json::Value>>(&stdout) {
            Ok(json_diagnostics) => {
                let mut diagnostics = Vec::new();

                for diag in json_diagnostics {
                    if let (Some(code), Some(message), Some(location)) = (
                        diag.get("code").and_then(|c| c.as_str()),
                        diag.get("message").and_then(|m| m.as_str()),
                        diag.get("location"),
                    ) {
                        if let (Some(row), Some(column)) = (
                            location.get("row").and_then(|r| r.as_u64()),
                            location.get("column").and_then(|c| c.as_u64()),
                        ) {
                            let end_location = diag.get("end_location");
                            let (end_row, end_column) = if let Some(end_loc) = end_location {
                                (
                                    end_loc.get("row").and_then(|r| r.as_u64()).unwrap_or(row),
                                    end_loc
                                        .get("column")
                                        .and_then(|c| c.as_u64())
                                        .unwrap_or(column + 1),
                                )
                            } else {
                                (row, column + 1)
                            };

                            diagnostics.push(RuffDiagnostic {
                                rule: code.to_string(),
                                message: message.to_string(),
                                line: row as u32,
                                column: column as u32,
                                end_line: end_row as u32,
                                end_column: end_column as u32,
                                severity: "warning".to_string(),
                                filename: diag
                                    .get("filename")
                                    .and_then(|f| f.as_str())
                                    .unwrap_or(&file_path)
                                    .to_string(),
                            });
                        }
                    }
                }

                Ok(RuffCheckResult {
                    diagnostics,
                    fixed: 0,
                    errors: if !stderr.trim().is_empty() {
                        vec![stderr.to_string()]
                    } else {
                        vec![]
                    },
                })
            }
            Err(_) => {
                // Fallback if JSON parsing fails
                Ok(RuffCheckResult {
                    diagnostics: vec![],
                    fixed: 0,
                    errors: if !stderr.trim().is_empty() {
                        vec![stderr.to_string()]
                    } else {
                        vec![]
                    },
                })
            }
        }
    } else {
        // No issues found - no JSON output
        Ok(RuffCheckResult {
            diagnostics: vec![],
            fixed: 0,
            errors: if !stderr.trim().is_empty() {
                vec![stderr.to_string()]
            } else {
                vec![]
            },
        })
    }
}

#[tauri::command]
pub async fn ruff_check_project(project_path: String) -> Result<RuffCheckResult, String> {
    let mut cmd = Command::new("uv");
    cmd.args(&[
            "run",
            "ruff",
            "check",
            ".",
            "--output-format=json",
            "--no-cache",
        ])
        .current_dir(&project_path)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(target_os = "windows")]
    {
        cmd.creation_flags(0x08000000);
    }
    let output = cmd.output()
        .map_err(|e| format!("Failed to execute uv run ruff check: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if output.status.success() || !stderr.is_empty() {
        if !stdout.trim().is_empty() {
            match serde_json::from_str::<Vec<serde_json::Value>>(&stdout) {
                Ok(json_diagnostics) => {
                    let mut diagnostics = Vec::new();

                    for diag in json_diagnostics {
                        if let (Some(code), Some(message), Some(location), Some(filename)) = (
                            diag.get("code").and_then(|c| c.as_str()),
                            diag.get("message").and_then(|m| m.as_str()),
                            diag.get("location"),
                            diag.get("filename").and_then(|f| f.as_str()),
                        ) {
                            if let (Some(row), Some(column)) = (
                                location.get("row").and_then(|r| r.as_u64()),
                                location.get("column").and_then(|c| c.as_u64()),
                            ) {
                                let end_location = diag.get("end_location");
                                let (end_row, end_column) = if let Some(end_loc) = end_location {
                                    (
                                        end_loc.get("row").and_then(|r| r.as_u64()).unwrap_or(row),
                                        end_loc
                                            .get("column")
                                            .and_then(|c| c.as_u64())
                                            .unwrap_or(column + 1),
                                    )
                                } else {
                                    (row, column + 1)
                                };

                                diagnostics.push(RuffDiagnostic {
                                    rule: code.to_string(),
                                    message: message.to_string(),
                                    line: row as u32,
                                    column: column as u32,
                                    end_line: end_row as u32,
                                    end_column: end_column as u32,
                                    severity: "warning".to_string(),
                                    filename: filename.to_string(),
                                });
                            }
                        }
                    }

                    Ok(RuffCheckResult {
                        diagnostics,
                        fixed: 0,
                        errors: if !stderr.trim().is_empty() {
                            vec![stderr.to_string()]
                        } else {
                            vec![]
                        },
                    })
                }
                Err(_) => Ok(RuffCheckResult {
                    diagnostics: vec![],
                    fixed: 0,
                    errors: if !stderr.trim().is_empty() {
                        vec![stderr.to_string()]
                    } else {
                        vec![]
                    },
                }),
            }
        } else {
            Ok(RuffCheckResult {
                diagnostics: vec![],
                fixed: 0,
                errors: vec![],
            })
        }
    } else {
        Err(stderr.to_string())
    }
}

#[tauri::command]
pub async fn ruff_format_file(project_path: String, file_path: String) -> Result<String, String> {
    let mut cmd = Command::new("uv");
    cmd.args(&["run", "ruff", "format", &file_path, "--no-cache"])
        .current_dir(&project_path)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(target_os = "windows")]
    {
        cmd.creation_flags(0x08000000);
    }
    let output = cmd.output()
        .map_err(|e| format!("Failed to execute uv run ruff format: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(stderr.to_string())
    }
}

#[tauri::command]
pub async fn ruff_format_project(project_path: String) -> Result<String, String> {
    let mut cmd = Command::new("uv");
    cmd.args(&["run", "ruff", "format", ".", "--no-cache"])
        .current_dir(&project_path)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(target_os = "windows")]
    {
        cmd.creation_flags(0x08000000);
    }
    let output = cmd.output()
        .map_err(|e| format!("Failed to execute uv run ruff format: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        Ok(format!("{}{}", stdout, stderr))
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(stderr.to_string())
    }
}

#[tauri::command]
pub async fn ruff_fix_file(
    project_path: String,
    file_path: String,
) -> Result<RuffCheckResult, String> {
    let mut cmd = Command::new("uv");
    cmd.args(&[
            "run",
            "ruff",
            "check",
            &file_path,
            "--fix",
            "--output-format=json",
            "--no-cache",
        ])
        .current_dir(&project_path)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(target_os = "windows")]
    {
        cmd.creation_flags(0x08000000);
    }
    let output = cmd.output()
        .map_err(|e| format!("Failed to execute uv run ruff fix: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    // Count fixed issues from stderr
    let fixed_count = stderr.matches("fixed").count() as u32;

    if output.status.success() || !stderr.is_empty() {
        if !stdout.trim().is_empty() {
            match serde_json::from_str::<Vec<serde_json::Value>>(&stdout) {
                Ok(json_diagnostics) => {
                    let mut diagnostics = Vec::new();

                    for diag in json_diagnostics {
                        if let (Some(code), Some(message), Some(location)) = (
                            diag.get("code").and_then(|c| c.as_str()),
                            diag.get("message").and_then(|m| m.as_str()),
                            diag.get("location"),
                        ) {
                            if let (Some(row), Some(column)) = (
                                location.get("row").and_then(|r| r.as_u64()),
                                location.get("column").and_then(|c| c.as_u64()),
                            ) {
                                let end_location = diag.get("end_location");
                                let (end_row, end_column) = if let Some(end_loc) = end_location {
                                    (
                                        end_loc.get("row").and_then(|r| r.as_u64()).unwrap_or(row),
                                        end_loc
                                            .get("column")
                                            .and_then(|c| c.as_u64())
                                            .unwrap_or(column + 1),
                                    )
                                } else {
                                    (row, column + 1)
                                };

                                diagnostics.push(RuffDiagnostic {
                                    rule: code.to_string(),
                                    message: message.to_string(),
                                    line: row as u32,
                                    column: column as u32,
                                    end_line: end_row as u32,
                                    end_column: end_column as u32,
                                    severity: "warning".to_string(),
                                    filename: diag
                                        .get("filename")
                                        .and_then(|f| f.as_str())
                                        .unwrap_or(&file_path)
                                        .to_string(),
                                });
                            }
                        }
                    }

                    Ok(RuffCheckResult {
                        diagnostics,
                        fixed: fixed_count,
                        errors: if !stderr.trim().is_empty() && !stderr.contains("fixed") {
                            vec![stderr.to_string()]
                        } else {
                            vec![]
                        },
                    })
                }
                Err(_) => Ok(RuffCheckResult {
                    diagnostics: vec![],
                    fixed: fixed_count,
                    errors: if !stderr.trim().is_empty() && !stderr.contains("fixed") {
                        vec![stderr.to_string()]
                    } else {
                        vec![]
                    },
                }),
            }
        } else {
            Ok(RuffCheckResult {
                diagnostics: vec![],
                fixed: fixed_count,
                errors: vec![],
            })
        }
    } else {
        Err(stderr.to_string())
    }
}

#[tauri::command]
pub async fn create_ruff_config(project_path: String) -> Result<String, String> {
    let config_content = r#"[tool.ruff]
# Exclude a variety of commonly ignored directories.
exclude = [
    ".bzr",
    ".direnv",
    ".eggs",
    ".git",
    ".git-rewrite",
    ".hg",
    ".ipynb_checkpoints",
    ".mypy_cache",
    ".nox",
    ".pants.d",
    ".pyenv",
    ".pytest_cache",
    ".pytype",
    ".ruff_cache",
    ".svn",
    ".tox",
    ".venv",
    ".vscode",
    "__pypackages__",
    "_build",
    "buck-out",
    "build",
    "dist",
    "node_modules",
    "site-packages",
    "venv",
]

# Same as Black.
line-length = 88
indent-width = 4

# Assume Python 3.8+
target-version = "py38"

[tool.ruff.lint]
# Enable Pyflakes (`F`) and a subset of the pycodestyle (`E`)  codes by default.
# Unlike Flake8, Ruff doesn't enable pycodestyle warnings (`W`) or
# McCabe complexity (`C901`) by default.
select = ["E4", "E7", "E9", "F"]
ignore = []

# Allow fix for all enabled rules (when `--fix`) is provided.
fixable = ["ALL"]
unfixable = []

# Allow unused variables when underscore-prefixed.
dummy-variable-rgx = "^(_+|(_+[a-zA-Z0-9_]*[a-zA-Z0-9]+?))$"

[tool.ruff.format]
# Like Black, use double quotes for strings.
quote-style = "double"

# Like Black, indent with spaces, rather than tabs.
indent-style = "space"

# Like Black, respect magic trailing commas.
skip-magic-trailing-comma = false

# Like Black, automatically detect the appropriate line ending.
line-ending = "auto"

# Enable auto-formatting of code examples in docstrings. Markdown,
# reStructuredText code/text blocks and doctests are all supported.
#
# This is currently disabled by default, but it is planned for this
# to be opt-out in the future.
docstring-code-format = false

# Set the line length limit used when formatting code snippets in
# docstrings.
#
# This only has an effect when the `docstring-code-format` setting is
# enabled.
docstring-code-line-length = "dynamic"
"#;

    let config_path = std::path::Path::new(&project_path).join("pyproject.toml");

    if config_path.exists() {
        // Read existing pyproject.toml and append ruff config
        let existing_content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read pyproject.toml: {}", e))?;

        // Check if ruff config already exists
        if existing_content.contains("[tool.ruff]") {
            return Ok("Ruff configuration already exists in pyproject.toml".to_string());
        }

        let new_content = format!("{}\n\n{}", existing_content, config_content);
        std::fs::write(&config_path, new_content)
            .map_err(|e| format!("Failed to write pyproject.toml: {}", e))?;

        Ok("Ruff configuration added to existing pyproject.toml".to_string())
    } else {
        // Create new pyproject.toml with just ruff config
        std::fs::write(&config_path, config_content)
            .map_err(|e| format!("Failed to create pyproject.toml: {}", e))?;

        Ok("Created pyproject.toml with Ruff configuration".to_string())
    }
}
