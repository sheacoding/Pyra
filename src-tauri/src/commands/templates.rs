// [INPUT]: 依赖 serde/toml 解析模板元数据，依赖 include_str! 编译期嵌入模板文件
// [OUTPUT]: 对外提供 get_project_templates, create_project_from_template 命令，
//           以及 ProjectTemplate, TemplateFile 类型
// [POS]: commands 模块的模板引擎，管理项目模板注册与创建
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use crate::process;

// ============================================================
// 数据类型
// ============================================================

#[derive(Serialize, Deserialize, Clone)]
pub struct ProjectTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub files: Vec<TemplateFile>,
    pub dependencies: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TemplateFile {
    pub path: String,
    pub content: String,
    pub is_directory: bool,
}

/// 模板元数据 (从 meta.toml 解析)
#[derive(Deserialize)]
struct TemplateMeta {
    id: String,
    name: String,
    description: String,
    category: String,
    #[serde(default)]
    dependencies: Vec<String>,
    files: Vec<FileEntry>,
}

#[derive(Deserialize)]
struct FileEntry {
    path: String,
    #[serde(default)]
    is_directory: bool,
}

// ============================================================
// 编译期嵌入模板数据
// ============================================================

struct TemplateBundle {
    meta: &'static str,
    files: &'static [(&'static str, &'static str)],
}

const BASIC: TemplateBundle = TemplateBundle {
    meta: include_str!("../templates/basic/meta.toml"),
    files: &[
        ("main.py", include_str!("../templates/basic/main.py")),
        ("README.md", include_str!("../templates/basic/README.md")),
    ],
};

const CLI_APP: TemplateBundle = TemplateBundle {
    meta: include_str!("../templates/cli_app/meta.toml"),
    files: &[
        ("main.py", include_str!("../templates/cli_app/main.py")),
        ("README.md", include_str!("../templates/cli_app/README.md")),
    ],
};

const WEB_API: TemplateBundle = TemplateBundle {
    meta: include_str!("../templates/web_api/meta.toml"),
    files: &[
        ("main.py", include_str!("../templates/web_api/main.py")),
        ("requirements.txt", include_str!("../templates/web_api/requirements.txt")),
        ("README.md", include_str!("../templates/web_api/README.md")),
    ],
};

const DATA_ANALYSIS: TemplateBundle = TemplateBundle {
    meta: include_str!("../templates/data_analysis/meta.toml"),
    files: &[
        ("main.py", include_str!("../templates/data_analysis/main.py")),
        ("requirements.txt", include_str!("../templates/data_analysis/requirements.txt")),
        ("README.md", include_str!("../templates/data_analysis/README.md")),
    ],
};

const ALL_BUNDLES: &[&TemplateBundle] = &[&BASIC, &CLI_APP, &WEB_API, &DATA_ANALYSIS];

const GITIGNORE: &str = include_str!("../templates/gitignore.txt");

// ============================================================
// 模板加载
// ============================================================

fn load_template(bundle: &TemplateBundle) -> ProjectTemplate {
    let meta: TemplateMeta = toml::from_str(bundle.meta)
        .expect("Invalid template meta.toml");

    let files: Vec<TemplateFile> = meta.files.iter().map(|entry| {
        let content = if entry.is_directory {
            String::new()
        } else {
            bundle.files
                .iter()
                .find(|(path, _)| *path == entry.path)
                .map(|(_, content)| content.to_string())
                .unwrap_or_default()
        };

        TemplateFile {
            path: entry.path.clone(),
            content,
            is_directory: entry.is_directory,
        }
    }).collect();

    ProjectTemplate {
        id: meta.id,
        name: meta.name,
        description: meta.description,
        category: meta.category,
        files,
        dependencies: meta.dependencies,
    }
}

fn get_builtin_templates() -> Vec<ProjectTemplate> {
    ALL_BUNDLES.iter().map(|b| load_template(b)).collect()
}

// ============================================================
// pyproject.toml 生成
// ============================================================

fn create_pyproject_toml(project_name: &str, dependencies: &[String]) -> String {
    let deps_str = if dependencies.is_empty() {
        String::new()
    } else {
        let formatted: Vec<String> = dependencies
            .iter()
            .map(|dep| format!("    \"{}\"", dep))
            .collect();
        format!("dependencies = [\n{}\n]", formatted.join(",\n"))
    };

    format!(
        r#"[project]
name = "{}"
version = "0.1.0"
description = "A Python project created with Pyra IDE"
authors = [
    {{name = "Your Name", email = "your.email@example.com"}}
]
readme = "README.md"
license = {{text = "MIT"}}
requires-python = ">=3.9"
{}

[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[tool.ruff]
line-length = 88
target-version = "py39"

[tool.ruff.lint]
select = [
    "E",  # pycodestyle errors
    "W",  # pycodestyle warnings
    "F",  # pyflakes
    "I",  # isort
    "B",  # flake8-bugbear
    "C4", # flake8-comprehensions
    "UP", # pyupgrade
]
ignore = []

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false
line-ending = "auto"
"#,
        project_name, deps_str
    )
}

// ============================================================
// Tauri 命令
// ============================================================

#[tauri::command]
pub async fn get_project_templates() -> Result<Vec<ProjectTemplate>, String> {
    Ok(get_builtin_templates())
}

#[tauri::command]
pub async fn create_project_from_template(
    project_path: String,
    template_id: String,
    project_name: String,
    python_version: Option<String>,
) -> Result<String, String> {
    let templates = get_builtin_templates();
    let template = templates
        .iter()
        .find(|t| t.id == template_id)
        .ok_or_else(|| format!("Template '{}' not found", template_id))?;

    let project_dir = Path::new(&project_path);

    // 检查目录状态
    if project_dir.exists() {
        let entries: Vec<_> = fs::read_dir(project_dir)
            .map_err(|e| format!("Failed to read project directory: {}", e))?
            .collect();

        let has_important_files = entries.iter().any(|entry| {
            entry.as_ref().ok().map_or(false, |e| {
                let name = e.file_name();
                let n = name.to_string_lossy();
                !matches!(n.as_ref(), "pyproject.toml" | ".gitignore" | "README.md" | "requirements.txt")
            })
        });

        if has_important_files {
            return Err(format!(
                "Directory '{}' already exists and contains files. Please choose an empty directory or different name.",
                project_path
            ));
        }

        // 清理已有 pyproject.toml
        let existing_pyproject = project_dir.join("pyproject.toml");
        if existing_pyproject.exists() {
            fs::remove_file(&existing_pyproject)
                .map_err(|e| format!("Failed to remove existing pyproject.toml: {}", e))?;
        }
    } else {
        fs::create_dir_all(project_dir)
            .map_err(|e| format!("Failed to create project directory: {}", e))?;
    }

    // 写入模板文件
    for file in &template.files {
        let file_path = project_dir.join(&file.path);
        if file.is_directory {
            fs::create_dir_all(&file_path)
                .map_err(|e| format!("Failed to create directory {}: {}", file.path, e))?;
        } else {
            if let Some(parent) = file_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create parent directory for {}: {}", file.path, e))?;
            }
            fs::write(&file_path, &file.content)
                .map_err(|e| format!("Failed to create file {}: {}", file.path, e))?;
        }
    }

    // 生成 pyproject.toml
    fs::write(
        project_dir.join("pyproject.toml"),
        create_pyproject_toml(&project_name, &template.dependencies),
    )
    .map_err(|e| format!("Failed to create pyproject.toml: {}", e))?;

    // 生成 .gitignore
    fs::write(project_dir.join(".gitignore"), GITIGNORE)
        .map_err(|e| format!("Failed to create .gitignore: {}", e))?;

    // UV 初始化
    let mut uv_args = vec!["init", "--name", &project_name];
    if let Some(ref version) = python_version {
        uv_args.extend_from_slice(&["--python", version]);
    }

    let project_path_str = project_dir.to_string_lossy().to_string();
    let mut uv_cmd = process::std_cmd_in("uv", &project_path_str);
    uv_cmd.args(&uv_args);
    let uv_success = uv_cmd.output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    if !uv_success {
        // Fallback: 已经写了 pyproject.toml，无需额外操作
    }

    // 安装模板依赖
    if !template.dependencies.is_empty() {
        for dep in &template.dependencies {
            let mut add_cmd = process::std_cmd_in("uv", &project_path_str);
            add_cmd.args(["add", dep]);
            if let Ok(output) = add_cmd.output() {
                if !output.status.success() {
                    eprintln!("Warning: Failed to add dependency {}: {}",
                        dep, String::from_utf8_lossy(&output.stderr));
                }
            }
        }

        let mut sync_cmd = process::std_cmd_in("uv", &project_path_str);
        sync_cmd.arg("sync");
        if let Ok(output) = sync_cmd.output() {
            if !output.status.success() {
                eprintln!("Warning: Failed to sync dependencies: {}",
                    String::from_utf8_lossy(&output.stderr));
            }
        }
    }

    Ok(format!(
        "Project '{}' created successfully from template '{}' with Python {}",
        project_name,
        template.name,
        python_version.as_deref().unwrap_or("default")
    ))
}
