use std::process::{Command, Stdio, Child};
use std::path::Path;
use std::io::{BufRead, BufReader};
use serde::{Deserialize, Serialize};
use tauri::{Window, State};
use std::sync::Arc;
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

#[tauri::command]
pub async fn check_uv_installed() -> Result<bool, String> {
    let output = Command::new("uv")
        .arg("--version")
        .output();
    
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
pub async fn create_venv(project_path: String, python_version: Option<String>) -> Result<String, String> {
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
    let output = Command::new("uv")
        .args(&["pip", "install", &package])
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
    let output = Command::new("uv")
        .args(&["pip", "uninstall", &package, "--yes"])
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
pub async fn list_packages(project_path: String) -> Result<Vec<Package>, String> {
    let output = Command::new("uv")
        .args(&["pip", "list", "--format=json"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute uv: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let packages: Result<Vec<Package>, _> = serde_json::from_str(&stdout);
        
        match packages {
            Ok(packages) => Ok(packages),
            Err(_) => {
                // Fallback to parsing plain text output
                let output = Command::new("uv")
                    .args(&["pip", "list"])
                    .current_dir(&project_path)
                    .output()
                    .map_err(|e| format!("Failed to execute uv: {}", e))?;

                if output.status.success() {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    let packages: Vec<Package> = stdout
                        .lines()
                        .skip(2) // Skip header lines
                        .filter_map(|line| {
                            let parts: Vec<&str> = line.split_whitespace().collect();
                            if parts.len() >= 2 {
                                Some(Package {
                                    name: parts[0].to_string(),
                                    version: parts[1].to_string(),
                                })
                            } else {
                                None
                            }
                        })
                        .collect();
                    Ok(packages)
                } else {
                    Err(String::from_utf8_lossy(&output.stderr).to_string())
                }
            }
        }
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
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
    process_manager: State<'_, ProcessManager>
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
pub async fn stop_running_script(process_manager: State<'_, ProcessManager>) -> Result<String, String> {
    println!("stop_running_script called");
    let mut current_process = process_manager.lock().await;
    if let Some(mut child) = current_process.take() {
        println!("Found process to kill");
        match child.kill() {
            Ok(_) => {
                println!("Process kill() successful");
                let _ = child.wait();
                Ok("Script stopped successfully".to_string())
            }
            Err(e) => {
                println!("Process kill() failed: {}", e);
                Err(format!("Failed to stop script: {}", e))
            }
        }
    } else {
        println!("No process found to kill");
        Ok("No script is currently running".to_string())
    }
}

// Simplified version for quick execution without streaming
#[tauri::command]
pub async fn run_script_simple(project_path: String, script_path: String) -> Result<String, String> {
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