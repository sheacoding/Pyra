use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use tauri::{Emitter, State, Window};
use tokio::sync::Mutex;

// Global process manager to track running processes
type ProcessManager = Arc<Mutex<Option<Child>>>;

pub fn create_process_manager() -> ProcessManager {
    Arc::new(Mutex::new(None))
}

#[derive(Serialize, Deserialize)]
pub struct PythonVersion {
    pub version: String,
    pub path: String,
    pub is_installed: bool,
}

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

#[tauri::command]
pub async fn check_uv_installed() -> Result<bool, String> {
    let output = Command::new("uv").arg("--version").output();

    match output {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn list_python_versions() -> Result<Vec<String>, String> {
    let output = Command::new("uv")
        .args(&["python", "list"])
        .output()
        .map_err(|e| format!("Failed to execute uv: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let versions: Vec<String> = stdout
            .lines()
            .filter_map(|line| {
                // Parse uv python list output
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
    let output = Command::new("uv")
        .args(&["python", "install", &version])
        .output()
        .map_err(|e| format!("Failed to execute uv: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn create_venv(
    project_path: String,
    python_version: Option<String>,
) -> Result<String, String> {
    let mut args = vec!["venv", ".venv"];

    // Add python version if specified
    let python_arg;
    if let Some(version) = python_version {
        python_arg = format!("--python={}", version);
        args.push(&python_arg);
    }

    let output = Command::new("uv")
        .args(&args)
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute uv: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn check_venv_exists(project_path: String) -> bool {
    let venv_path = Path::new(&project_path).join(".venv");
    venv_path.exists() && venv_path.is_dir()
}

#[tauri::command]
pub async fn install_package(project_path: String, package: String) -> Result<String, String> {
    // Check if project has pyproject.toml (UV project)
    let pyproject_path = std::path::Path::new(&project_path).join("pyproject.toml");
    if !pyproject_path.exists() {
        return Err("This is not a UV project. Please initialize with 'uv init' first or create a pyproject.toml file.".to_string());
    }

    let output = Command::new("uv")
        .args(&["add", &package])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute uv: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn uninstall_package(project_path: String, package: String) -> Result<String, String> {
    // Check if project has pyproject.toml (UV project)
    let pyproject_path = std::path::Path::new(&project_path).join("pyproject.toml");
    if !pyproject_path.exists() {
        return Err("This is not a UV project. Please initialize with 'uv init' first or create a pyproject.toml file.".to_string());
    }

    let output = Command::new("uv")
        .args(&["remove", &package])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute uv: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn get_dependency_tree(project_path: String) -> Result<DependencyTree, String> {
    // Check if project has pyproject.toml (UV project)
    let pyproject_path = std::path::Path::new(&project_path).join("pyproject.toml");
    if !pyproject_path.exists() {
        return Err("This is not a UV project. Please initialize with 'uv init' first or create a pyproject.toml file.".to_string());
    }

    // Use uv tree to show detailed dependencies
    let output = Command::new("uv")
        .args(&["tree", "--depth", "3"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute uv: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut packages = Vec::new();
        let mut current_package: Option<PackageWithDeps> = None;
        let mut total_count = 0;

        for line in stdout.lines() {
            let depth = line.chars().take_while(|c| *c == '├' || *c == '│' || *c == '└' || *c == '─' || *c == ' ').count() / 4;
            
            // Clean the line from tree characters
            let cleaned_line = line
                .chars()
                .skip_while(|&c| c == '├' || c == '└' || c == '│' || c == '─' || c == ' ')
                .collect::<String>();

            if cleaned_line.contains(" v") {
                if let Some(version_pos) = cleaned_line.find(" v") {
                    let name = cleaned_line[..version_pos].trim().to_string();
                    let version = cleaned_line[version_pos + 2..].trim().to_string();
                    
                    if depth == 0 {
                        // Root level package - save previous and start new
                        if let Some(pkg) = current_package.take() {
                            packages.push(pkg);
                        }
                        current_package = Some(PackageWithDeps {
                            name: name.clone(),
                            version: version.clone(),
                            dependencies: Vec::new(),
                            depth: depth as u32,
                        });
                        total_count += 1;
                    } else if let Some(ref mut current) = current_package {
                        // Dependency of current package
                        current.dependencies.push(Package { name, version });
                    }
                }
            }
        }

        // Add the last package
        if let Some(pkg) = current_package {
            packages.push(pkg);
        }

        Ok(DependencyTree {
            packages,
            total_count,
        })
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn list_packages(project_path: String) -> Result<Vec<Package>, String> {
    // Check if project has pyproject.toml (UV project)
    let pyproject_path = std::path::Path::new(&project_path).join("pyproject.toml");
    if !pyproject_path.exists() {
        return Err("This is not a UV project. Please initialize with 'uv init' first or create a pyproject.toml file.".to_string());
    }

    // Use uv tree to show dependencies
    let output = Command::new("uv")
        .args(&["tree"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute uv: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);

        // Parse the tree output to extract package names and versions
        let packages: Vec<Package> = stdout
            .lines()
            .filter_map(|line| {
                // Match lines like "├── requests v2.31.0" or "└── urllib3 v2.0.4"
                if line.contains(" v") {
                    // Remove tree characters and extract package info
                    let cleaned_line = line
                        .chars()
                        .skip_while(|&c| c == '├' || c == '└' || c == '│' || c == '─' || c == ' ')
                        .collect::<String>();

                    if let Some(version_pos) = cleaned_line.find(" v") {
                        let name = cleaned_line[..version_pos].trim().to_string();
                        let version = cleaned_line[version_pos + 2..].trim().to_string();
                        Some(Package { name, version })
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
            .collect();

        Ok(packages)
    } else {
        // Fallback: try to read from pyproject.toml
        let pyproject_content = std::fs::read_to_string(&pyproject_path)
            .map_err(|e| format!("Failed to read pyproject.toml: {}", e))?;

        // Parse dependencies from pyproject.toml (basic parsing)
        let mut packages = Vec::new();
        let mut in_dependencies = false;

        for line in pyproject_content.lines() {
            let line = line.trim();
            if line == "dependencies = [" {
                in_dependencies = true;
                continue;
            }
            if in_dependencies && line == "]" {
                break;
            }
            if in_dependencies && line.starts_with('"') && line.ends_with(',') {
                // Extract package name from "package>=version", format
                let dep = line
                    .trim_start_matches('"')
                    .trim_end_matches("\",")
                    .trim_end_matches('"');
                if let Some(eq_pos) = dep.find(">=") {
                    let name = dep[..eq_pos].to_string();
                    let version = dep[eq_pos + 2..].to_string();
                    packages.push(Package {
                        name,
                        version: format!("{} (from pyproject.toml)", version),
                    });
                } else if let Some(eq_pos) = dep.find("==") {
                    let name = dep[..eq_pos].to_string();
                    let version = dep[eq_pos + 2..].to_string();
                    packages.push(Package { name, version });
                } else {
                    packages.push(Package {
                        name: dep.to_string(),
                        version: "latest (from pyproject.toml)".to_string(),
                    });
                }
            }
        }

        Ok(packages)
    }
}

#[tauri::command]
pub async fn run_script(project_path: String, script_path: String) -> Result<String, String> {
    let python_exe = if cfg!(target_os = "windows") {
        format!("{}/.venv/Scripts/python.exe", project_path)
    } else {
        format!("{}/.venv/bin/python", project_path)
    };

    let output = Command::new(python_exe)
        .arg(script_path)
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute Python script: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    Ok(format!("{}{}", stdout, stderr))
}

#[tauri::command]
pub async fn run_script_with_output_streaming(
    window: Window,
    project_path: String,
    script_path: String,
    process_manager: State<'_, ProcessManager>,
) -> Result<String, String> {
    // Kill any existing process first
    {
        let mut current_process = process_manager.lock().await;
        if let Some(mut child) = current_process.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }

    // Determine Python executable path
    let python_exe = if cfg!(target_os = "windows") {
        format!("{}/.venv/Scripts/python.exe", project_path)
    } else {
        format!("{}/.venv/bin/python", project_path)
    };

    // First, try the virtual environment Python, fallback to system Python
    let mut cmd = Command::new(&python_exe);

    // If venv doesn't exist, try system python
    if !Path::new(&python_exe).exists() {
        cmd = Command::new("python");
    }

    let mut child = cmd
        .arg(&script_path)
        .current_dir(&project_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Python script: {}", e))?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    // Store the process in the manager
    {
        let mut current_process = process_manager.lock().await;
        *current_process = Some(child);
    }

    // Handle stdout in a separate task
    let window_stdout = window.clone();
    let stdout_handle = tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = window_stdout.emit("script-output", &format!("{}\n", line));
            }
        }
    });

    // Handle stderr in a separate task
    let window_stderr = window.clone();
    let stderr_handle = tokio::spawn(async move {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = window_stderr.emit("script-error", &format!("{}\n", line));
            }
        }
    });

    // Handle process completion in background task
    let process_manager_wait = Arc::clone(&*process_manager);
    let completion_window = window.clone();
    tokio::spawn(async move {
        loop {
            // Check if process still exists and wait for a short time
            let should_continue = {
                let mut current_process = process_manager_wait.lock().await;
                if let Some(ref mut child) = *current_process {
                    // Try to wait without blocking indefinitely
                    match child.try_wait() {
                        Ok(Some(status)) => {
                            // Process has completed
                            *current_process = None;
                            let _ = completion_window.emit("script-completed", status.success());
                            break;
                        }
                        Ok(None) => {
                            // Process is still running, continue loop
                            true
                        }
                        Err(_) => {
                            // Error occurred, consider process stopped
                            *current_process = None;
                            let _ = completion_window.emit("script-completed", false);
                            break;
                        }
                    }
                } else {
                    // Process was stopped externally
                    let _ = completion_window.emit("script-completed", false);
                    break;
                }
            };

            if !should_continue {
                break;
            }

            // Wait a short time before checking again
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }

        // Wait for output handlers to complete
        let _ = stdout_handle.await;
        let _ = stderr_handle.await;
    });

    // Return immediately so UI stays responsive
    Ok("Script started successfully".to_string())
}

// Command to stop the currently running process
#[tauri::command]
pub async fn stop_running_script(
    process_manager: State<'_, ProcessManager>,
) -> Result<String, String> {
    println!("stop_running_script called");
    let mut current_process = process_manager.lock().await;
    if let Some(mut child) = current_process.take() {
        println!("Found process to kill");
        match child.kill() {
            Ok(_) => {
                println!("Process kill() successful");
                let _ = child.wait();
            }
            Err(e) => {
                println!("Process kill() failed: {}", e);
            }
        }

        // On Windows, also try to kill UV and Python processes more forcefully
        #[cfg(target_os = "windows")]
        {
            use std::process::Command;

            // Try to kill any remaining UV or Python processes
            let _ = Command::new("taskkill")
                .args(&["/F", "/IM", "uv.exe"])
                .output();

            let _ = Command::new("taskkill")
                .args(&["/F", "/IM", "python.exe"])
                .output();

            println!("Attempted forceful termination of UV and Python processes");
        }

        Ok("Script stopped successfully".to_string())
    } else {
        println!("No process found to kill");
        Ok("No script is currently running".to_string())
    }
}

// Simplified version for quick execution without streaming
#[tauri::command]
pub async fn run_script_simple(
    project_path: String,
    script_path: String,
) -> Result<String, String> {
    let python_exe = if cfg!(target_os = "windows") {
        format!("{}/.venv/Scripts/python.exe", project_path)
    } else {
        format!("{}/.venv/bin/python", project_path)
    };

    // First, try the virtual environment Python, fallback to system Python
    let mut cmd = Command::new(&python_exe);

    // If venv doesn't exist, try system python
    if !Path::new(&python_exe).exists() {
        cmd = Command::new("python");
    }

    let output = cmd
        .arg(script_path)
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute Python script: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    Ok(format!("{}{}", stdout, stderr))
}

#[tauri::command]
pub async fn init_uv_project(
    project_path: String,
    project_name: String,
    python_version: Option<String>,
) -> Result<String, String> {
    // Initialize UV project with pyproject.toml
    let mut args = vec!["init", "--name", &project_name];

    // Add python version if specified
    if let Some(ref version) = python_version {
        args.push("--python");
        args.push(version);
    }

    let output = Command::new("uv")
        .args(&args)
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute uv init: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn sync_uv_project(project_path: String) -> Result<String, String> {
    // Sync dependencies based on pyproject.toml and uv.lock
    let output = Command::new("uv")
        .args(&["sync"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute uv sync: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn run_script_with_uv(
    project_path: String,
    script_path: String,
) -> Result<String, String> {
    // Use 'uv run' to execute script with project dependencies
    let output = Command::new("uv")
        .args(&["run", "python", &script_path])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute uv run: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    Ok(format!("{}{}", stdout, stderr))
}

#[tauri::command]
pub async fn run_script_with_uv_streaming(
    window: Window,
    project_path: String,
    script_path: String,
    process_manager: State<'_, ProcessManager>,
) -> Result<String, String> {
    // Kill any existing process first
    {
        let mut current_process = process_manager.lock().await;
        if let Some(mut child) = current_process.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }

    // Use 'uv run' to execute script with streaming output
    let mut child = Command::new("uv")
        .args(&["run", "python", &script_path])
        .current_dir(&project_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start uv run: {}", e))?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    // Store the process in the manager
    {
        let mut current_process = process_manager.lock().await;
        *current_process = Some(child);
    }

    // Handle stdout in a separate task
    let window_stdout = window.clone();
    let stdout_handle = tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = window_stdout.emit("script-output", &format!("{}\\n", line));
            }
        }
    });

    // Handle stderr in a separate task
    let window_stderr = window.clone();
    let stderr_handle = tokio::spawn(async move {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = window_stderr.emit("script-error", &format!("{}\\n", line));
            }
        }
    });

    // Handle process completion in background task
    let process_manager_wait = Arc::clone(&*process_manager);
    let completion_window = window.clone();
    tokio::spawn(async move {
        loop {
            // Check if process still exists and wait for a short time
            let should_continue = {
                let mut current_process = process_manager_wait.lock().await;
                if let Some(ref mut child) = *current_process {
                    // Try to wait without blocking indefinitely
                    match child.try_wait() {
                        Ok(Some(status)) => {
                            // Process has completed
                            *current_process = None;
                            let _ = completion_window.emit("script-completed", status.success());
                            break;
                        }
                        Ok(None) => {
                            // Process is still running, continue loop
                            true
                        }
                        Err(_) => {
                            // Error occurred, consider process stopped
                            *current_process = None;
                            let _ = completion_window.emit("script-completed", false);
                            break;
                        }
                    }
                } else {
                    // Process was stopped externally
                    let _ = completion_window.emit("script-completed", false);
                    break;
                }
            };

            if !should_continue {
                break;
            }

            // Wait a short time before checking again
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }

        // Wait for output handlers to complete
        let _ = stdout_handle.await;
        let _ = stderr_handle.await;
    });

    // Return immediately so UI stays responsive
    Ok("UV run started successfully".to_string())
}
