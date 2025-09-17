use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::Manager;

#[derive(Serialize, Deserialize)]
pub struct FileItem {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: Option<u64>,
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_directory(path: String) -> Result<Vec<FileItem>, String> {
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;

    let mut files = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_path = entry.path();
        let name = file_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown")
            .to_string();

        let is_directory = file_path.is_dir();
        let size = if is_directory {
            None
        } else {
            file_path.metadata().ok().map(|m| m.len())
        };

        files.push(FileItem {
            name,
            path: file_path.display().to_string(),
            is_directory,
            size,
        });
    }

    // Sort directories first, then files
    files.sort_by(|a, b| match (a.is_directory, b.is_directory) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(files)
}

#[tauri::command]
pub async fn create_file(path: String) -> Result<(), String> {
    fs::File::create(path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    if Path::new(&path).is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn file_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[tauri::command]
pub async fn open_file_dialog(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    use tokio::sync::oneshot;

    let (tx, rx) = oneshot::channel();

    // Get the main window to use as parent for the dialog
    let main_window = app_handle.get_webview_window("main");

    let mut dialog = app_handle.dialog().file();

    // Set parent window if available to prevent blank popup
    if let Some(window) = main_window {
        dialog = dialog.set_parent(&window);
    }

    dialog
        .add_filter("All Files", &["*"])
        .add_filter("Python Files", &["py"])
        .add_filter("Text Files", &["txt", "md", "json", "toml", "yaml", "yml"])
        .pick_file(move |file_path| {
            let result = file_path.map(|p| p.to_string());
            let _ = tx.send(result);
        });

    match rx.await {
        Ok(file_path) => Ok(file_path),
        Err(_) => Err("Dialog was cancelled or failed".to_string())
    }
}

#[tauri::command]
pub async fn save_file_dialog(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    use tokio::sync::oneshot;

    let (tx, rx) = oneshot::channel();

    // Get the main window to use as parent for the dialog
    let main_window = app_handle.get_webview_window("main");

    let mut dialog = app_handle.dialog().file();

    // Set parent window if available to prevent blank popup
    if let Some(window) = main_window {
        dialog = dialog.set_parent(&window);
    }

    dialog
        .add_filter("All Files", &["*"])
        .add_filter("Python Files", &["py"])
        .add_filter("Text Files", &["txt", "md", "json", "toml", "yaml", "yml"])
        .save_file(move |file_path| {
            let result = file_path.map(|p| p.to_string());
            let _ = tx.send(result);
        });

    match rx.await {
        Ok(file_path) => Ok(file_path),
        Err(_) => Err("Dialog was cancelled or failed".to_string())
    }
}
