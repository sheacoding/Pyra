#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// [INPUT]: 依赖 commands 模块的所有子命令，依赖 tauri 框架
// [OUTPUT]: 应用程序入口，注册所有命令和状态
// [POS]: 整个 Rust 后端的入口点
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

mod commands;
mod error;
mod process;

fn main() {
    let process_manager = commands::runner::create_process_manager();
    let debug_manager = commands::debug::create_debug_manager();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .manage(process_manager)
        .manage(debug_manager)
        .invoke_handler(tauri::generate_handler![
            // 文件系统
            commands::file::read_file,
            commands::file::write_file,
            commands::file::list_directory,
            commands::file::create_file,
            commands::file::create_directory,
            commands::file::delete_file,
            commands::file::file_exists,
            commands::file::open_file_dialog,
            commands::file::save_file_dialog,
            // UV 工具链
            commands::uv::check_uv_installed,
            commands::uv::ensure_uv_installed,
            commands::uv::list_python_versions,
            commands::uv::install_python_version,
            commands::uv::create_venv,
            commands::uv::check_venv_exists,
            commands::uv::init_uv_project,
            commands::uv::sync_uv_project,
            // 包管理
            commands::packages::install_package,
            commands::packages::uninstall_package,
            commands::packages::list_packages,
            commands::packages::get_dependency_tree,
            // 脚本执行
            commands::runner::run_script,
            commands::runner::run_script_simple,
            commands::runner::run_script_with_uv,
            commands::runner::run_script_with_output_streaming,
            commands::runner::run_script_with_uv_streaming,
            commands::runner::stop_running_script,
            // 项目管理
            commands::project::create_new_project,
            commands::project::open_project_dialog,
            commands::project::load_project_config,
            commands::project::save_project_config,
            commands::project::get_recent_projects,
            commands::project::read_pyproject_toml,
            commands::project::write_pyproject_toml,
            commands::project::check_pyproject_exists,
            // 模板
            commands::templates::get_project_templates,
            commands::templates::create_project_from_template,
            // Ruff 代码检查
            commands::ruff::check_ruff_installed,
            commands::ruff::install_ruff_with_uv,
            commands::ruff::ruff_check_file,
            commands::ruff::ruff_check_project,
            commands::ruff::ruff_format_file,
            commands::ruff::ruff_format_project,
            commands::ruff::ruff_fix_file,
            commands::ruff::create_ruff_config,
            // 调试器
            commands::debug::start_debug_session,
            commands::debug::debug_continue,
            commands::debug::debug_step_over,
            commands::debug::debug_step_into,
            commands::debug::debug_step_out,
            commands::debug::get_stack_trace,
            commands::debug::get_scopes,
            commands::debug::get_variables,
            commands::debug::stop_debug_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
