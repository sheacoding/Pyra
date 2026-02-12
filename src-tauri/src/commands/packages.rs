// [INPUT]: 依赖 crate::process 的 cmd_in, exec, exec_raw 函数
// [OUTPUT]: 对外提供 install_package, uninstall_package, list_packages,
//           get_dependency_tree 命令，以及 Package, PackageWithDeps, DependencyTree 类型
// [POS]: commands 模块的包管理器，处理依赖安装/卸载/查询
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

use serde::{Deserialize, Serialize};
use crate::process;

// ============================================================
// 数据类型
// ============================================================

#[derive(Serialize, Deserialize)]
pub struct Package {
    pub name: String,
    pub version: String,
}

#[derive(Serialize, Deserialize)]
pub struct PackageWithDeps {
    pub name: String,
    pub version: String,
    pub dependencies: Vec<Package>,
    pub depth: u32,
}

#[derive(Serialize, Deserialize)]
pub struct DependencyTree {
    pub packages: Vec<PackageWithDeps>,
    pub total_count: u32,
}

// ============================================================
// 辅助函数 —— pyproject.toml 存在性检查
// ============================================================

fn require_pyproject(project_path: &str) -> Result<(), String> {
    let pyproject_path = std::path::Path::new(project_path).join("pyproject.toml");
    if !pyproject_path.exists() {
        return Err(
            "This is not a UV project. Please initialize with 'uv init' first or create a pyproject.toml file."
                .to_string(),
        );
    }
    Ok(())
}

// ============================================================
// 包管理命令
// ============================================================

#[tauri::command]
pub async fn install_package(project_path: String, package: String) -> Result<String, String> {
    require_pyproject(&project_path)?;
    let mut c = process::cmd_in("uv", &project_path);
    c.args(["add", &package]);
    process::exec(c).await
}

#[tauri::command]
pub async fn uninstall_package(project_path: String, package: String) -> Result<String, String> {
    require_pyproject(&project_path)?;
    let mut c = process::cmd_in("uv", &project_path);
    c.args(["remove", &package]);
    process::exec(c).await
}

#[tauri::command]
pub async fn list_packages(project_path: String) -> Result<Vec<Package>, String> {
    require_pyproject(&project_path)?;

    let mut c = process::cmd_in("uv", &project_path);
    c.arg("tree");
    let output = process::exec_raw(c).await?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let packages: Vec<Package> = stdout
            .lines()
            .filter_map(parse_tree_line)
            .collect();
        Ok(packages)
    } else {
        // Fallback: 从 pyproject.toml 解析
        parse_packages_from_pyproject(&project_path)
    }
}

#[tauri::command]
pub async fn get_dependency_tree(project_path: String) -> Result<DependencyTree, String> {
    require_pyproject(&project_path)?;

    let mut c = process::cmd_in("uv", &project_path);
    c.args(["tree", "--depth", "3"]);
    let output = process::exec_raw(c).await?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(parse_dependency_tree(&stdout))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// ============================================================
// 解析器 —— 将 uv tree 输出转换为结构化数据
// ============================================================

/// 解析单行 tree 输出为 Package
fn parse_tree_line(line: &str) -> Option<Package> {
    if !line.contains(" v") {
        return None;
    }
    let cleaned = line
        .chars()
        .skip_while(|c| matches!(c, '│' | '├' | '└' | '─' | ' '))
        .collect::<String>();
    let version_pos = cleaned.find(" v")?;
    let name = cleaned[..version_pos].trim().to_string();
    let version = cleaned[version_pos + 2..].trim().to_string();
    Some(Package { name, version })
}

/// 解析完整依赖树
fn parse_dependency_tree(stdout: &str) -> DependencyTree {
    let mut packages = Vec::new();
    let mut current_package: Option<PackageWithDeps> = None;
    let mut total_count = 0;

    for line in stdout.lines() {
        if !line.contains(" v") {
            continue;
        }

        let prefix_len = line
            .chars()
            .take_while(|c| matches!(c, '│' | '├' | '└' | '─' | ' '))
            .count();
        let depth = prefix_len / 4;

        let cleaned = line
            .chars()
            .skip_while(|c| matches!(c, '│' | '├' | '└' | '─' | ' '))
            .collect::<String>();

        if let Some(version_pos) = cleaned.find(" v") {
            let name = cleaned[..version_pos].trim().to_string();
            let version = cleaned[version_pos + 2..].trim().to_string();

            if depth == 0 {
                if let Some(pkg) = current_package.take() {
                    packages.push(pkg);
                }
                current_package = Some(PackageWithDeps {
                    name,
                    version,
                    dependencies: Vec::new(),
                    depth: depth as u32,
                });
                total_count += 1;
            } else if let Some(ref mut current) = current_package {
                current.dependencies.push(Package { name, version });
            }
        }
    }

    if let Some(pkg) = current_package {
        packages.push(pkg);
    }

    DependencyTree {
        packages,
        total_count,
    }
}

/// Fallback: 从 pyproject.toml 解析包列表
fn parse_packages_from_pyproject(project_path: &str) -> Result<Vec<Package>, String> {
    let pyproject_path = std::path::Path::new(project_path).join("pyproject.toml");
    let content = std::fs::read_to_string(&pyproject_path)
        .map_err(|e| format!("Failed to read pyproject.toml: {}", e))?;

    let mut packages = Vec::new();
    let mut in_dependencies = false;

    for line in content.lines() {
        let line = line.trim();
        if line == "dependencies = [" {
            in_dependencies = true;
            continue;
        }
        if in_dependencies && line == "]" {
            break;
        }
        if in_dependencies && line.starts_with('"') && line.ends_with(',') {
            let dep = line
                .trim_start_matches('"')
                .trim_end_matches("\",")
                .trim_end_matches('"');

            let (name, version) = if let Some(pos) = dep.find(">=") {
                (
                    dep[..pos].to_string(),
                    format!("{} (from pyproject.toml)", &dep[pos + 2..]),
                )
            } else if let Some(pos) = dep.find("==") {
                (dep[..pos].to_string(), dep[pos + 2..].to_string())
            } else {
                (dep.to_string(), "latest (from pyproject.toml)".to_string())
            };

            packages.push(Package { name, version });
        }
    }

    Ok(packages)
}
