// lib.rs
use serde::Serialize;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, State};
use tauri::command;
use std::io::Read;
use std::process::Stdio;

#[derive(Clone, Serialize)]
struct CommandOutput {
    content: String,
    is_error: bool,
}

// 全局进程管理器
struct ProcessManager {
    child: Arc<Mutex<Option<std::process::Child>>>,
    is_running: Arc<Mutex<bool>>,
}

impl ProcessManager {
    fn new() -> Self {
        Self {
            child: Arc::new(Mutex::new(None)),
            is_running: Arc::new(Mutex::new(false)),
        }
    }
}

#[command]
async fn execute_command_realtime(
    cmd: String,
    args: Vec<String>,
    window: tauri::Window,
    state: State<'_, ProcessManager>,
) -> Result<(), String> {
    // 先终止之前的进程
    if let Ok(mut child_guard) = state.child.lock() {
        if let Some(mut old_child) = child_guard.take() {
            let _ = old_child.kill();
        }
    }
    
    // 重置运行状态
    if let Ok(mut running_guard) = state.is_running.lock() {
        *running_guard = false;
    }

    let mut command = std::process::Command::new(&cmd);
    command.args(&args);
    
    // 设置当前工作目录为项目根目录
    if let Ok(current_dir) = std::env::current_dir() {
        command.current_dir(current_dir);
    }

    // 配置标准输入输出
    command.stdin(Stdio::piped());
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        // Windows 下启用 ANSI 颜色支持
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    let mut child = command.spawn().map_err(|e| format!("执行命令失败: {}", e))?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    // 设置运行状态
    if let Ok(mut running_guard) = state.is_running.lock() {
        *running_guard = true;
    }

    // 处理标准输出
    let window_stdout = window.clone();
    let is_running_clone = state.is_running.clone();
    std::thread::spawn(move || {
        let mut reader = std::io::BufReader::new(stdout);
        let mut buffer = [0u8; 1024];
        
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => {
                    // EOF，进程结束
                    if let Ok(mut running) = is_running_clone.lock() {
                        *running = false;
                    }
                    break;
                }
                Ok(n) => {
                    let content = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let output = CommandOutput {
                        content,
                        is_error: false,
                    };
                    let _ = window_stdout.emit("command-output", output);
                }
                Err(_) => {
                    if let Ok(mut running) = is_running_clone.lock() {
                        *running = false;
                    }
                    break;
                }
            }
        }
    });

    // 处理标准错误
    let window_stderr = window.clone();
    let is_running_clone = state.is_running.clone();
    std::thread::spawn(move || {
        let mut reader = std::io::BufReader::new(stderr);
        let mut buffer = [0u8; 1024];
        
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => {
                    // EOF，进程结束
                    if let Ok(mut running) = is_running_clone.lock() {
                        *running = false;
                    }
                    break;
                }
                Ok(n) => {
                    let content = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let output = CommandOutput {
                        content,
                        is_error: true,
                    };
                    let _ = window_stderr.emit("command-output", output);
                }
                Err(_) => {
                    if let Ok(mut running) = is_running_clone.lock() {
                        *running = false;
                    }
                    break;
                }
            }
        }
    });

    // 保存子进程引用
    if let Ok(mut child_guard) = state.child.lock() {
        *child_guard = Some(child);
    }

    Ok(())
}

#[command]
async fn send_terminal_input(
    input: String,
    state: State<'_, ProcessManager>,
) -> Result<(), String> {
    // 检查进程是否还在运行
    let is_running = {
        if let Ok(running_guard) = state.is_running.lock() {
            *running_guard
        } else {
            false
        }
    };
    
    if !is_running {
        return Err("进程已结束，无法发送输入".to_string());
    }

    if let Ok(mut child_guard) = state.child.lock() {
        if let Some(child) = child_guard.as_mut() {
            if let Some(stdin) = child.stdin.as_mut() {
                use std::io::Write;
                
                // 将输入写入子进程的 stdin
                stdin.write_all(input.as_bytes()).map_err(|e| e.to_string())?;
                stdin.flush().map_err(|e| e.to_string())?;
                return Ok(());
            }
        }
    }
    
    Err("没有活动的进程或无法获取 stdin".to_string())
}

#[command]
async fn kill_current_process(state: State<'_, ProcessManager>) -> Result<(), String> {
    if let Ok(mut child_guard) = state.child.lock() {
        if let Some(mut child) = child_guard.take() {
            child.kill().map_err(|e| e.to_string())?;
        }
    }
    
    // 重置运行状态
    if let Ok(mut running_guard) = state.is_running.lock() {
        *running_guard = false;
    }
    
    Ok(())
}

#[command]
async fn is_process_running(state: State<'_, ProcessManager>) -> Result<bool, String> {
    if let Ok(running_guard) = state.is_running.lock() {
        Ok(*running_guard)
    } else {
        Ok(false)
    }
}

#[command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(ProcessManager::new())
        .invoke_handler(tauri::generate_handler![
            execute_command_realtime,
            send_terminal_input,
            kill_current_process,
            is_process_running,
            greet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}