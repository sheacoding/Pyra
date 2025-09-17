use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri_plugin_dialog::DialogExt;
use tauri::Manager;

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

#[tauri::command]
pub async fn create_new_project(
    name: String,
    path: String,
    python_version: Option<String>,
) -> Result<ProjectConfig, String> {
    let project_path = Path::new(&path).join(&name);

    // Create project directory
    fs::create_dir_all(&project_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    // Create basic project structure
    let src_dir = project_path.join("src");
    fs::create_dir_all(&src_dir).map_err(|e| format!("Failed to create src directory: {}", e))?;

    // Create main.py file
    let main_py_content = r#"#!/usr/bin/env python3
"""
Main entry point for the project.
"""

def main():
    print("Hello from Pyra IDE!")
    print("This is a new Python project.")

if __name__ == "__main__":
    main()
"#;

    fs::write(src_dir.join("main.py"), main_py_content)
        .map_err(|e| format!("Failed to create main.py: {}", e))?;

    // Create README.md
    let readme_content = format!(
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
    );

    fs::write(project_path.join("README.md"), readme_content)
        .map_err(|e| format!("Failed to create README.md: {}", e))?;

    // Create requirements.txt
    fs::write(
        project_path.join("requirements.txt"),
        "# Add your project dependencies here\n",
    )
    .map_err(|e| format!("Failed to create requirements.txt: {}", e))?;

    // Try to initialize as UV project first
    let mut uv_args = vec!["init", "--name", &name];
    if let Some(ref version) = python_version {
        uv_args.push("--python");
        uv_args.push(version);
    }

    let uv_init_success = match Command::new("uv")
        .args(&uv_args)
        .current_dir(&project_path)
        .output()
    {
        Ok(output) if output.status.success() => {
            true // UV init succeeded
        }
        Ok(output) => {
            eprintln!(
                "UV init failed: {}",
                String::from_utf8_lossy(&output.stderr)
            );
            false
        }
        Err(e) => {
            eprintln!("UV not available: {}", e);
            false
        }
    };

    // If UV init failed, create basic pyproject.toml
    if !uv_init_success {
        let pyproject_content = format!(
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

        fs::write(project_path.join("pyproject.toml"), pyproject_content)
            .map_err(|e| format!("Failed to create pyproject.toml: {}", e))?;
    }

    // Create project config
    let now = chrono::Utc::now().to_rfc3339();
    let config = ProjectConfig {
        name: name.clone(),
        path: project_path.to_string_lossy().to_string(),
        python_version,
        dependencies: vec![],
        created_at: now.clone(),
        last_opened: now,
    };

    // Save project config
    let config_content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize project config: {}", e))?;

    fs::write(project_path.join(".pyra-project.json"), config_content)
        .map_err(|e| format!("Failed to save project config: {}", e))?;

    Ok(config)
}

#[tauri::command]
pub async fn open_project_dialog(app: tauri::AppHandle) -> Result<String, String> {
    use std::sync::{Arc, Mutex};
    use tokio::time::{sleep, Duration};

    let result = Arc::new(Mutex::new(None));
    let result_clone = Arc::clone(&result);

    // Get the main window to use as parent for the dialog
    let main_window = app.get_webview_window("main");

    let mut dialog = app.dialog().file();

    // Set parent window if available to prevent blank popup
    if let Some(window) = main_window {
        dialog = dialog.set_parent(&window);
    }

    // Use Tauri v2 dialog API with callback
    dialog.pick_folder(move |folder_path| {
        let mut res = result_clone.lock().unwrap();
        *res = folder_path;
    });

    // Wait for the dialog to complete with polling
    for _ in 0..100 { // Wait up to 10 seconds (100 * 100ms)
        sleep(Duration::from_millis(100)).await;

        let res = result.lock().unwrap();
        if let Some(path) = res.as_ref() {
            return Ok(path.to_string());
        }
    }

    // If no selection was made, return current directory as fallback
    if let Ok(path) = std::env::current_dir() {
        Ok(path.to_string_lossy().to_string())
    } else {
        Err("Could not get current directory".to_string())
    }
}

#[tauri::command]
pub async fn load_project_config(project_path: String) -> Result<ProjectConfig, String> {
    let config_path = Path::new(&project_path).join(".pyra-project.json");

    if !config_path.exists() {
        // Create a default config for existing projects
        let name = Path::new(&project_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown Project")
            .to_string();

        let now = chrono::Utc::now().to_rfc3339();
        let config = ProjectConfig {
            name,
            path: project_path,
            python_version: None,
            dependencies: vec![],
            created_at: now.clone(),
            last_opened: now,
        };

        return Ok(config);
    }

    let config_content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read project config: {}", e))?;

    let mut config: ProjectConfig = serde_json::from_str(&config_content)
        .map_err(|e| format!("Failed to parse project config: {}", e))?;

    // Update last opened time
    config.last_opened = chrono::Utc::now().to_rfc3339();

    // Save updated config
    let updated_config_content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize updated project config: {}", e))?;

    fs::write(&config_path, updated_config_content)
        .map_err(|e| format!("Failed to save updated project config: {}", e))?;

    Ok(config)
}

#[tauri::command]
pub async fn save_project_config(config: ProjectConfig) -> Result<(), String> {
    let config_path = Path::new(&config.path).join(".pyra-project.json");

    let config_content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize project config: {}", e))?;

    fs::write(&config_path, config_content)
        .map_err(|e| format!("Failed to save project config: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_recent_projects() -> Result<Vec<ProjectConfig>, String> {
    // This would typically read from a global config file
    // For now, return an empty list
    Ok(vec![])
}

#[tauri::command]
pub async fn read_pyproject_toml(project_path: String) -> Result<PyProjectToml, String> {
    let pyproject_path = Path::new(&project_path).join("pyproject.toml");
    
    if !pyproject_path.exists() {
        return Err("pyproject.toml not found".to_string());
    }
    
    let content = fs::read_to_string(&pyproject_path)
        .map_err(|e| format!("Failed to read pyproject.toml: {}", e))?;
    
    // Parse TOML content manually since it's complex to map directly to our struct
    let value: toml::Value = content.parse()
        .map_err(|e| format!("Failed to parse pyproject.toml: {}", e))?;
    
    let project_table = value.get("project")
        .ok_or("Missing [project] section in pyproject.toml")?;
    
    let name = project_table.get("name")
        .and_then(|v| v.as_str())
        .ok_or("Missing project name")?
        .to_string();
    
    let version = project_table.get("version")
        .and_then(|v| v.as_str())
        .unwrap_or("0.1.0")
        .to_string();
    
    let description = project_table.get("description")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    
    let authors = project_table.get("authors")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str()).map(|s| s.to_string()).collect())
        .unwrap_or_default();
    
    let requires_python = project_table.get("requires-python")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    
    let license = project_table.get("license")
        .and_then(|v| v.as_str())
        .or_else(|| project_table.get("license").and_then(|v| v.get("text")).and_then(|v| v.as_str()))
        .map(|s| s.to_string());
    
    let readme = project_table.get("readme")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    
    let dependencies = project_table.get("dependencies")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str()).map(|s| s.to_string()).collect())
        .unwrap_or_default();
    
    let dev_dependencies = value.get("tool")
        .and_then(|tool| tool.get("uv"))
        .and_then(|uv| uv.get("dev-dependencies"))
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str()).map(|s| s.to_string()).collect())
        .unwrap_or_default();
    
    let build_system = value.get("build-system").map(|bs| {
        let requires = bs.get("requires")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|v| v.as_str()).map(|s| s.to_string()).collect())
            .unwrap_or_default();
        
        let build_backend = bs.get("build-backend")
            .and_then(|v| v.as_str())
            .unwrap_or("setuptools.build_meta")
            .to_string();
        
        BuildSystem { requires, build_backend }
    });
    
    let project_metadata = ProjectMetadata {
        name,
        version,
        description,
        authors,
        requires_python,
        license,
        readme,
    };
    
    Ok(PyProjectToml {
        project: project_metadata,
        dependencies,
        dev_dependencies,
        build_system,
    })
}

#[tauri::command]
pub async fn write_pyproject_toml(project_path: String, config: PyProjectToml) -> Result<(), String> {
    let pyproject_path = Path::new(&project_path).join("pyproject.toml");
    
    // Build TOML content
    let mut content = String::new();
    
    // [project] section
    content.push_str("[project]\n");
    content.push_str(&format!("name = \"{}\"\n", config.project.name));
    content.push_str(&format!("version = \"{}\"\n", config.project.version));
    
    if let Some(ref description) = config.project.description {
        content.push_str(&format!("description = \"{}\"\n", description));
    }
    
    if !config.project.authors.is_empty() {
        content.push_str("authors = [\n");
        for author in &config.project.authors {
            content.push_str(&format!("    \"{}\",\n", author));
        }
        content.push_str("]\n");
    }
    
    if let Some(ref requires_python) = config.project.requires_python {
        content.push_str(&format!("requires-python = \"{}\"\n", requires_python));
    }
    
    if let Some(ref license) = config.project.license {
        content.push_str(&format!("license = \"{}\"\n", license));
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
    
    // [build-system] section
    if let Some(ref build_system) = config.build_system {
        content.push_str("\n[build-system]\n");
        if !build_system.requires.is_empty() {
            content.push_str("requires = [\n");
            for req in &build_system.requires {
                content.push_str(&format!("    \"{}\",\n", req));
            }
            content.push_str("]\n");
        }
        content.push_str(&format!("build-backend = \"{}\"\n", build_system.build_backend));
    }
    
    // [tool.uv] section for dev dependencies
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
    let pyproject_path = Path::new(&project_path).join("pyproject.toml");
    pyproject_path.exists()
}
