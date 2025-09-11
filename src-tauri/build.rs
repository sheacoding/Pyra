fn main() {
    // Skip tauri build for development to avoid icon issues
    if std::env::var("CARGO_CFG_DEBUG_ASSERTIONS").is_ok() {
        return;
    }
    tauri_build::build()
}