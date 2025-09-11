#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod commands;
mod file_manager;
mod python_manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let process_manager = commands::python::create_process_manager();
    
    tauri::Builder::default()
        .manage(process_manager)
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::file::read_file,
            commands::file::write_file,
            commands::file::list_directory,
            commands::file::create_file,
            commands::file::create_directory,
            commands::file::delete_file,
            commands::file::file_exists,
            commands::python::check_uv_installed,
            commands::python::list_python_versions,
            commands::python::install_python_version,
            commands::python::create_venv,
            commands::python::check_venv_exists,
            commands::python::install_package,
            commands::python::uninstall_package,
            commands::python::list_packages,
            commands::python::run_script,
            commands::python::run_script_with_output_streaming,
            commands::python::run_script_simple,
            commands::python::stop_running_script
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}