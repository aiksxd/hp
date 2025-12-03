use tauri;

#[tauri::command]
fn rust_exec(code: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", code)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_python::init_and_register(vec![
            "python_exec"
        ]))
        .invoke_handler(tauri::generate_handler![rust_exec])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
