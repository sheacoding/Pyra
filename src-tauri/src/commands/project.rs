// [INPUT]: 依赖 crate::process 的 std_cmd_in 函数，依赖 tauri_plugin_dialog,
//          依赖 chrono, toml, serde_json 解析
// [OUTPUT]: 对外提供 create_new_project, open_project_dialog, load_project_config,
//           save_project_config, get_recent_projects, read_pyproject_toml,
//           write_pyproject_toml, check_pyproject_exists 命令
// [POS]: commands 模块的项目管理器，处理项目创建/打开/配置
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use crate::process;

// ============================================================
// 数据类型
// ============================================================

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectConfig {
    pub name: String,
    pub path: String,
    pub python_version: Option<String>,
    pub dependencies: Vec<String>,
    pub created_at: String,
    pub last_opened: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PyProjectToml {
    pub project: ProjectMetadata,
    pub dependencies: Vec<String>,
    pub dev_dependencies: Vec<String>,
    pub build_system: Option<BuildSystem>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectMetadata {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub authors: Vec<String>,
    pub requires_python: Option<String>,
    pub license: Option<String>,
    pub readme: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BuildSystem {
    pub requires: Vec<String>,
    pub build_backend: String,
}

// ============================================================
// 项目创建
// ============================================================

#[tauri::command]
pub async fn create_new_project(
    name: String,
    path: String,
    python_version: Option<String>,
) -> Result<ProjectConfig, String> {
    let project_path = Path::new(&path).join(&name);

    fs::create_dir_all(&project_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    // 创建基础项目结构
    let src_dir = project_path.join("src");
    fs::create_dir_all(&src_dir).map_err(|e| format!("Failed to create src directory: {}", e))?;

    fs::write(
        src_dir.join("main.py"),
        r#"#!/usr/bin/env python3
"""
Main entry point for the project.
"""

def main():
    print("Hello from Pyra IDE!")
    print("This is a new Python project.")

if __name__ == "__main__":
    main()
"#,
    )
    .map_err(|e| format!("Failed to create main.py: {}", e))?;

    fs::write(
        project_path.join("README.md"),
        format!(
            r#"# {}

A Python project created with Pyra IDE.

## Getting Started

1. Activate the virtual environment:
   ```bash
   # On Windows
   .venv\Scripts\activate

   # On macOS/Linux
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   uv pip install -r requirements.txt
   ```

3. Run the project:
   ```bash
   python src/main.py
   ```

## Dependencies

See `requirements.txt` for project dependencies.
"#,
            name
        ),
    )
    .map_err(|e| format!("Failed to create README.md: {}", e))?;

    fs::write(
        project_path.join("requirements.txt"),
        "# Add your project dependencies here\n",
    )
    .map_err(|e| format!("Failed to create requirements.txt: {}", e))?;

    // 尝试 UV 初始化
    let project_path_str = project_path.to_string_lossy().to_string();
    let uv_init_success = {
        let mut c = process::std_cmd_in("uv", &project_path_str);
        c.args(["init", "--name", &name]);
        if let Some(ref version) = python_version {
            c.args(["--python", version]);
        }
        match c.output() {
            Ok(output) if output.status.success() => true,
            Ok(output) => {
                eprintln!("UV init failed: {}", String::from_utf8_lossy(&output.stderr));
                false
            }
            Err(e) => {
                eprintln!("UV not available: {}", e);
                false
            }
        }
    };

    if !uv_init_success {
        let pyproject = format!(
            r#"[project]
name = "{}"
version = "0.1.0"
description = "A Python project created with Pyra IDE"
authors = ["Your Name <your.email@example.com>"]
requires-python = "{}"

[build-system]
requires = ["setuptools", "wheel"]
build-backend = "setuptools.build_meta"
"#,
            name,
            python_version.as_deref().unwrap_or(">=3.8")
        );
        fs::write(project_path.join("pyproject.toml"), pyproject)
            .map_err(|e| format!("Failed to create pyproject.toml: {}", e))?;
    }

    let now = chrono::Utc::now().to_rfc3339();
    let config = ProjectConfig {
        name: name.clone(),
        path: project_path_str,
        python_version,
        dependencies: vec![],
        created_at: now.clone(),
        last_opened: now,
    };

    let config_json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize project config: {}", e))?;
    fs::write(project_path.join(".pyra-project.json"), config_json)
        .map_err(|e| format!("Failed to save project config: {}", e))?;

    Ok(config)
}

// ============================================================
// 打开项目 —— 用 oneshot channel 替代 sleep 轮询
// ============================================================

#[tauri::command]
pub async fn open_project_dialog(app: tauri::AppHandle) -> Result<String, String> {
    let (tx, rx) = tokio::sync::oneshot::channel();

    let main_window = app.get_webview_window("main");
    let mut dialog = app.dialog().file();
    if let Some(window) = main_window {
        dialog = dialog.set_parent(&window);
    }

    dialog.pick_folder(move |folder_path| {
        let _ = tx.send(folder_path);
    });

    match rx.await {
        Ok(Some(path)) => Ok(path.to_string()),
        Ok(None) => {
            // 用户取消了对话框
            std::env::current_dir()
                .map(|p| p.to_string_lossy().to_string())
                .map_err(|_| "Could not get current directory".to_string())
        }
        Err(_) => Err("Dialog was cancelled or failed".to_string()),
    }
}

// ============================================================
// 项目配置 CRUD
// ============================================================

#[tauri::command]
pub async fn load_project_config(project_path: String) -> Result<ProjectConfig, String> {
    let config_path = Path::new(&project_path).join(".pyra-project.json");

    if !config_path.exists() {
        let name = Path::new(&project_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown Project")
            .to_string();

        let now = chrono::Utc::now().to_rfc3339();
        return Ok(ProjectConfig {
            name,
            path: project_path,
            python_version: None,
            dependencies: vec![],
            created_at: now.clone(),
            last_opened: now,
        });
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read project config: {}", e))?;

    let mut config: ProjectConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse project config: {}", e))?;

    config.last_opened = chrono::Utc::now().to_rfc3339();

    let updated = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize updated project config: {}", e))?;
    fs::write(&config_path, updated)
        .map_err(|e| format!("Failed to save updated project config: {}", e))?;

    Ok(config)
}

#[tauri::command]
pub async fn save_project_config(config: ProjectConfig) -> Result<(), String> {
    let config_path = Path::new(&config.path).join(".pyra-project.json");
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize project config: {}", e))?;
    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to save project config: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn get_recent_projects() -> Result<Vec<ProjectConfig>, String> {
    Ok(vec![])
}

// ============================================================
// pyproject.toml 读写
// ============================================================

#[tauri::command]
pub async fn read_pyproject_toml(project_path: String) -> Result<PyProjectToml, String> {
    let pyproject_path = Path::new(&project_path).join("pyproject.toml");

    if !pyproject_path.exists() {
        return Err("pyproject.toml not found".to_string());
    }

    let content = fs::read_to_string(&pyproject_path)
        .map_err(|e| format!("Failed to read pyproject.toml: {}", e))?;

    let value: toml::Value = content
        .parse()
        .map_err(|e| format!("Failed to parse pyproject.toml: {}", e))?;

    let project_table = value
        .get("project")
        .ok_or("Missing [project] section in pyproject.toml")?;

    let name = project_table
        .get("name")
        .and_then(|v| v.as_str())
        .ok_or("Missing project name")?
        .to_string();

    let version = project_table
        .get("version")
        .and_then(|v| v.as_str())
        .unwrap_or("0.1.0")
        .to_string();

    let description = project_table
        .get("description")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let authors = project_table
        .get("authors")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str())
                .map(|s| s.to_string())
                .collect()
        })
        .unwrap_or_default();

    let requires_python = project_table
        .get("requires-python")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let license = project_table
        .get("license")
        .and_then(|v| {
            v.as_str()
                .or_else(|| v.get("text").and_then(|t| t.as_str()))
        })
        .map(|s| s.to_string());

    let readme = project_table
        .get("readme")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let dependencies = project_table
        .get("dependencies")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str())
                .map(|s| s.to_string())
                .collect()
        })
        .unwrap_or_default();

    let dev_dependencies = value
        .get("tool")
        .and_then(|t| t.get("uv"))
        .and_then(|u| u.get("dev-dependencies"))
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str())
                .map(|s| s.to_string())
                .collect()
        })
        .unwrap_or_default();

    let build_system = value.get("build-system").map(|bs| {
        let requires = bs
            .get("requires")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str())
                    .map(|s| s.to_string())
                    .collect()
            })
            .unwrap_or_default();

        let build_backend = bs
            .get("build-backend")
            .and_then(|v| v.as_str())
            .unwrap_or("setuptools.build_meta")
            .to_string();

        BuildSystem {
            requires,
            build_backend,
        }
    });

    Ok(PyProjectToml {
        project: ProjectMetadata {
            name,
            version,
            description,
            authors,
            requires_python,
            license,
            readme,
        },
        dependencies,
        dev_dependencies,
        build_system,
    })
}

#[tauri::command]
pub async fn write_pyproject_toml(
    project_path: String,
    config: PyProjectToml,
) -> Result<(), String> {
    let pyproject_path = Path::new(&project_path).join("pyproject.toml");
    let mut content = String::new();

    // [project]
    content.push_str("[project]\n");
    content.push_str(&format!("name = \"{}\"\n", config.project.name));
    content.push_str(&format!("version = \"{}\"\n", config.project.version));
    if let Some(ref desc) = config.project.description {
        content.push_str(&format!("description = \"{}\"\n", desc));
    }
    if !config.project.authors.is_empty() {
        content.push_str("authors = [\n");
        for author in &config.project.authors {
            content.push_str(&format!("    \"{}\",\n", author));
        }
        content.push_str("]\n");
    }
    if let Some(ref rp) = config.project.requires_python {
        content.push_str(&format!("requires-python = \"{}\"\n", rp));
    }
    if let Some(ref lic) = config.project.license {
        content.push_str(&format!("license = \"{}\"\n", lic));
    }
    if let Some(ref readme) = config.project.readme {
        content.push_str(&format!("readme = \"{}\"\n", readme));
    }
    if !config.dependencies.is_empty() {
        content.push_str("dependencies = [\n");
        for dep in &config.dependencies {
            content.push_str(&format!("    \"{}\",\n", dep));
        }
        content.push_str("]\n");
    }

    // [build-system]
    if let Some(ref bs) = config.build_system {
        content.push_str("\n[build-system]\n");
        if !bs.requires.is_empty() {
            content.push_str("requires = [\n");
            for req in &bs.requires {
                content.push_str(&format!("    \"{}\",\n", req));
            }
            content.push_str("]\n");
        }
        content.push_str(&format!("build-backend = \"{}\"\n", bs.build_backend));
    }

    // [tool.uv]
    if !config.dev_dependencies.is_empty() {
        content.push_str("\n[tool.uv]\n");
        content.push_str("dev-dependencies = [\n");
        for dep in &config.dev_dependencies {
            content.push_str(&format!("    \"{}\",\n", dep));
        }
        content.push_str("]\n");
    }

    fs::write(&pyproject_path, content)
        .map_err(|e| format!("Failed to write pyproject.toml: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn check_pyproject_exists(project_path: String) -> bool {
    Path::new(&project_path).join("pyproject.toml").exists()
}
