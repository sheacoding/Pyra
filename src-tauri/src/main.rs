#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
// mod file_manager;
// mod python_manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let process_manager = commands::python::create_process_manager();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
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
            commands::python::get_dependency_tree,
            commands::python::run_script,
            commands::python::run_script_with_output_streaming,
            commands::python::run_script_simple,
            commands::python::stop_running_script,
            commands::python::init_uv_project,
            commands::python::sync_uv_project,
            commands::python::run_script_with_uv,
            commands::python::run_script_with_uv_streaming,
            commands::project::create_new_project,
            commands::project::open_project_dialog,
            commands::project::load_project_config,
            commands::project::save_project_config,
            commands::project::get_recent_projects,
            commands::project::read_pyproject_toml,
            commands::project::write_pyproject_toml,
            commands::project::check_pyproject_exists,
            commands::templates::get_project_templates,
            commands::templates::create_project_from_template,
            commands::ruff::check_ruff_installed,
            commands::ruff::install_ruff_with_uv,
            commands::ruff::ruff_check_file,
            commands::ruff::ruff_check_project,
            commands::ruff::ruff_format_file,
            commands::ruff::ruff_format_project,
            commands::ruff::ruff_fix_file,
            commands::ruff::create_ruff_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
