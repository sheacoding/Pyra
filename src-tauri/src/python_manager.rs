use std::process::Command;
use anyhow::{Result, anyhow};

pub struct PythonManager {
    project_path: String,
}

impl PythonManager {
    pub fn new(project_path: String) -> Self {
        Self { project_path }
    }

    pub async fn create_virtual_env(&self) -> Result<String> {
        let output = Command::new("uv")
            .args(&["venv", ".venv"])
            .current_dir(&self.project_path)
            .output()?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(anyhow!("Failed to create venv: {}", String::from_utf8_lossy(&output.stderr)))
        }
    }

    pub async fn run_script(&self, script_path: &str) -> Result<String> {
        let python_exe = if cfg!(target_os = "windows") {
            format!("{}/.venv/Scripts/python.exe", self.project_path)
        } else {
            format!("{}/.venv/bin/python", self.project_path)
        };

        let output = Command::new(python_exe)
            .arg(script_path)
            .current_dir(&self.project_path)
            .output()?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        
        Ok(format!("{}{}", stdout, stderr))
    }

    pub async fn install_package(&self, package: &str) -> Result<String> {
        let output = Command::new("uv")
            .args(&["pip", "install", package])
            .current_dir(&self.project_path)
            .output()?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(anyhow!("Failed to install package: {}", String::from_utf8_lossy(&output.stderr)))
        }
    }
}