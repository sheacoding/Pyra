// Copyright 2024 ericoding
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

use serde::{Deserialize, Serialize};
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use tauri::{Emitter, State, Window};
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::Mutex;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

// Debug session manager
pub type DebugSessionManager = Arc<Mutex<Option<DebugSession>>>;

pub fn create_debug_manager() -> DebugSessionManager {
    Arc::new(Mutex::new(None))
}

// Debug session structure
pub struct DebugSession {
    stream: Option<TcpStream>,
    process: Option<Child>,
    seq: u64,
    port: u16,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Breakpoint {
    pub id: Option<u32>,
    pub file: String,
    pub line: u32,
    pub verified: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct StackFrame {
    pub id: u32,
    pub name: String,
    pub file: String,
    pub line: u32,
    pub column: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Variable {
    pub name: String,
    pub value: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub variables_reference: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Scope {
    pub name: String,
    pub variables_reference: u32,
    pub expensive: bool,
}

impl DebugSession {
    pub fn new(port: u16) -> Self {
        Self {
            stream: None,
            process: None,
            seq: 1,
            port,
        }
    }

    pub async fn connect(&mut self) -> Result<(), String> {
        let stream = TcpStream::connect(format!("127.0.0.1:{}", self.port))
            .await
            .map_err(|e| format!("Failed to connect to debugpy: {}", e))?;
        self.stream = Some(stream);
        Ok(())
    }

    pub async fn send_request(
        &mut self,
        command: &str,
        arguments: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        let stream = self
            .stream
            .as_mut()
            .ok_or("Not connected to debug adapter")?;

        let request = serde_json::json!({
            "seq": self.seq,
            "type": "request",
            "command": command,
            "arguments": arguments
        });

        self.seq += 1;

        // Send DAP message
        let json = serde_json::to_string(&request).map_err(|e| e.to_string())?;
        let message = format!("Content-Length: {}\r\n\r\n{}", json.len(), json);

        stream
            .write_all(message.as_bytes())
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        // Read response
        self.read_response().await
    }

    async fn read_response(&mut self) -> Result<serde_json::Value, String> {
        let stream = self
            .stream
            .as_mut()
            .ok_or("Not connected to debug adapter")?;

        let mut reader = BufReader::new(stream);

        loop {
            // Read Content-Length header
            let mut header = String::new();
            loop {
                let mut line = String::new();
                reader
                    .read_line(&mut line)
                    .await
                    .map_err(|e| format!("Failed to read header: {}", e))?;

                if line == "\r\n" {
                    break;
                }
                header.push_str(&line);
            }

            // Parse Content-Length
            let content_length: usize = header
                .lines()
                .find(|l| l.starts_with("Content-Length:"))
                .and_then(|l| l.split(':').nth(1))
                .and_then(|s| s.trim().parse().ok())
                .ok_or("Missing Content-Length header")?;

            // Read JSON body
            let mut body = vec![0u8; content_length];
            reader
                .read_exact(&mut body)
                .await
                .map_err(|e| format!("Failed to read body: {}", e))?;

            let message: serde_json::Value =
                serde_json::from_slice(&body).map_err(|e| format!("Failed to parse JSON: {}", e))?;

            // Check if this is a response or an event
            let msg_type = message["type"].as_str().unwrap_or("");

            if msg_type == "response" {
                // This is a response, return it
                return Ok(message);
            } else if msg_type == "event" {
                // This is an event, log it and continue reading
                println!("[DEBUG] Skipping event during response read: {}", message["event"].as_str().unwrap_or("unknown"));
                // Continue loop to read the next message
            } else {
                // Unknown message type
                return Ok(message);
            }
        }
    }

    pub fn set_process(&mut self, process: Child) {
        self.process = Some(process);
    }

    pub async fn disconnect(&mut self) -> Result<(), String> {
        // Send disconnect request
        if self.stream.is_some() {
            let _ = self
                .send_request("disconnect", serde_json::json!({}))
                .await;
        }

        // Kill process
        if let Some(mut process) = self.process.take() {
            let _ = process.kill();
            let _ = process.wait();
        }

        self.stream = None;
        Ok(())
    }
}

// Find available TCP port
async fn find_available_port() -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("Failed to find available port: {}", e))?;
    let port = listener
        .local_addr()
        .map_err(|e| format!("Failed to get port: {}", e))?
        .port();
    Ok(port)
}

// Tauri Commands

#[tauri::command]
pub async fn start_debug_session(
    window: Window,
    project_path: String,
    script_path: String,
    breakpoints: Vec<Breakpoint>,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<String, String> {
    println!("[DEBUG] Starting debug session for: {}", script_path);

    // Check if debugpy is installed
    let python_exe = if cfg!(target_os = "windows") {
        format!("{}/.venv/Scripts/python.exe", project_path)
    } else {
        format!("{}/.venv/bin/python", project_path)
    };

    // Verify Python executable exists
    if !std::path::Path::new(&python_exe).exists() {
        return Err(format!("Python 可执行文件未找到: {}\n\n请先创建虚拟环境：\n1. 打开项目设置\n2. 创建 Python 虚拟环境", python_exe));
    }

    // Check if debugpy is installed
    let check_output = Command::new(&python_exe)
        .args(&["-m", "debugpy", "--version"])
        .output()
        .map_err(|e| format!("Failed to check debugpy: {}", e))?;

    if !check_output.status.success() {
        let stderr = String::from_utf8_lossy(&check_output.stderr);
        return Err(format!("debugpy 未安装。请通过以下方式安装：\n1. 点击工具栏的「包管理」按钮\n2. 搜索 \"debugpy\"\n3. 点击安装\n\nError: {}", stderr));
    }

    println!("[DEBUG] debugpy version: {}", String::from_utf8_lossy(&check_output.stdout).trim());

    // Find available port
    let port = find_available_port().await?;
    println!("[DEBUG] Using port: {}", port);

    let mut cmd = Command::new(&python_exe);
    cmd.args(&[
        "-m",
        "debugpy",
        "--listen",
        &format!("localhost:{}", port),
        "--wait-for-client",
        &script_path,
    ])
    .current_dir(&project_path)
    .stdin(Stdio::null())
    .stdout(Stdio::piped())
    .stderr(Stdio::piped());

    #[cfg(target_os = "windows")]
    {
        cmd.creation_flags(0x08000000);
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("启动 debugpy 失败: {}。\n请确保已安装 debugpy（通过工具栏「包管理」按钮安装）", e))?;

    println!("[DEBUG] debugpy process started with PID: {:?}", child.id());

    // Capture stderr to check for errors
    let stderr = child.stderr.take();

    // Create session
    let mut session = DebugSession::new(port);
    session.set_process(child);

    // Wait for debugpy to be ready and try to connect with retries
    let max_retries = 10;
    let mut connected = false;

    for i in 0..max_retries {
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

        match session.connect().await {
            Ok(_) => {
                connected = true;
                println!("[DEBUG] Connected to debugpy on attempt {}", i + 1);
                break;
            }
            Err(e) => {
                if i == max_retries - 1 {
                    // Check stderr for error messages
                    if let Some(mut stderr_reader) = stderr {
                        let mut stderr_output = String::new();
                        use std::io::Read;
                        let _ = stderr_reader.read_to_string(&mut stderr_output);
                        if !stderr_output.is_empty() {
                            return Err(format!("Failed to connect to debugpy: {}\nDebugpy error: {}", e, stderr_output));
                        }
                    }
                    return Err(format!("连接 debugpy 失败（尝试 {} 次后）: {}\n\n请检查：\n1. debugpy 是否已安装（通过工具栏「包管理」安装）\n2. Python 虚拟环境是否已创建\n3. 端口 {} 是否被占用", max_retries, e, port));
                }
                println!("[DEBUG] Connection attempt {} failed: {}, retrying...", i + 1, e);
            }
        }
    }

    if !connected {
        return Err("Failed to connect to debugpy".to_string());
    }

    println!("[DEBUG] Connected to debugpy");

    // Initialize DAP session
    let init_response = session
        .send_request(
            "initialize",
            serde_json::json!({
                "clientID": "pyra",
                "clientName": "Pyra IDE",
                "adapterID": "python",
                "pathFormat": "path",
                "linesStartAt1": true,
                "columnsStartAt1": true,
                "supportsVariableType": true,
                "supportsVariablePaging": false,
                "supportsRunInTerminalRequest": false,
            }),
        )
        .await?;

    println!("[DEBUG] Initialized: {:?}", init_response);

    // Send launch request - required even with --wait-for-client
    let launch_response = session
        .send_request(
            "launch",
            serde_json::json!({
                "name": "Python: Current File",
                "type": "python",
                "request": "launch",
                "program": script_path,
                "cwd": project_path,
                "console": "integratedTerminal",
                "justMyCode": true,
                "stopOnEntry": false
            }),
        )
        .await?;

    println!("[DEBUG] Launch: {:?}", launch_response);

    // Set breakpoints (group by file)
    println!("[DEBUG] Received {} breakpoints", breakpoints.len());
    if !breakpoints.is_empty() {
        // For now, we assume all breakpoints are in the same file
        let file_path = &breakpoints[0].file;
        let bp_lines: Vec<serde_json::Value> = breakpoints
            .iter()
            .map(|bp| serde_json::json!({ "line": bp.line }))
            .collect();

        let bp_response = session
            .send_request(
                "setBreakpoints",
                serde_json::json!({
                    "source": {
                        "path": file_path
                    },
                    "breakpoints": bp_lines
                }),
            )
            .await?;

        println!("[DEBUG] Breakpoints set: {:?}", bp_response);
    }

    // Send configuration done - this starts execution
    let config_response = session
        .send_request("configurationDone", serde_json::json!({}))
        .await?;

    println!("[DEBUG] Configuration done: {:?}", config_response);

    // Store session
    {
        let mut manager = debug_manager.lock().await;
        *manager = Some(session);
    }

    // Start event loop
    let manager_clone = Arc::clone(&*debug_manager);
    tokio::spawn(async move {
        debug_event_loop(manager_clone, window).await;
    });

    Ok(format!("Debug session started on port {}", port))
}

#[tauri::command]
pub async fn debug_continue(
    thread_id: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<(), String> {
    let mut manager = debug_manager.lock().await;
    if let Some(session) = manager.as_mut() {
        session
            .send_request("continue", serde_json::json!({ "threadId": thread_id }))
            .await?;
        Ok(())
    } else {
        Err("No active debug session".to_string())
    }
}

#[tauri::command]
pub async fn debug_step_over(
    thread_id: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<(), String> {
    let mut manager = debug_manager.lock().await;
    if let Some(session) = manager.as_mut() {
        session
            .send_request("next", serde_json::json!({ "threadId": thread_id }))
            .await?;
        Ok(())
    } else {
        Err("No active debug session".to_string())
    }
}

#[tauri::command]
pub async fn debug_step_into(
    thread_id: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<(), String> {
    let mut manager = debug_manager.lock().await;
    if let Some(session) = manager.as_mut() {
        session
            .send_request("stepIn", serde_json::json!({ "threadId": thread_id }))
            .await?;
        Ok(())
    } else {
        Err("No active debug session".to_string())
    }
}

#[tauri::command]
pub async fn debug_step_out(
    thread_id: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<(), String> {
    let mut manager = debug_manager.lock().await;
    if let Some(session) = manager.as_mut() {
        session
            .send_request("stepOut", serde_json::json!({ "threadId": thread_id }))
            .await?;
        Ok(())
    } else {
        Err("No active debug session".to_string())
    }
}

#[tauri::command]
pub async fn get_stack_trace(
    thread_id: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<Vec<StackFrame>, String> {
    let mut manager = debug_manager.lock().await;
    if let Some(session) = manager.as_mut() {
        let response = session
            .send_request("stackTrace", serde_json::json!({ "threadId": thread_id }))
            .await?;

        let frames = response["body"]["stackFrames"]
            .as_array()
            .ok_or("Invalid stackTrace response")?
            .iter()
            .map(|f| StackFrame {
                id: f["id"].as_u64().unwrap_or(0) as u32,
                name: f["name"].as_str().unwrap_or("").to_string(),
                file: f["source"]["path"].as_str().unwrap_or("").to_string(),
                line: f["line"].as_u64().unwrap_or(0) as u32,
                column: f["column"].as_u64().unwrap_or(0) as u32,
            })
            .collect();

        Ok(frames)
    } else {
        Err("No active debug session".to_string())
    }
}

#[tauri::command]
pub async fn get_scopes(
    frame_id: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<Vec<Scope>, String> {
    let mut manager = debug_manager.lock().await;
    if let Some(session) = manager.as_mut() {
        let response = session
            .send_request("scopes", serde_json::json!({ "frameId": frame_id }))
            .await?;

        let scopes = response["body"]["scopes"]
            .as_array()
            .ok_or("Invalid scopes response")?
            .iter()
            .map(|s| Scope {
                name: s["name"].as_str().unwrap_or("").to_string(),
                variables_reference: s["variablesReference"].as_u64().unwrap_or(0) as u32,
                expensive: s["expensive"].as_bool().unwrap_or(false),
            })
            .collect();

        Ok(scopes)
    } else {
        Err("No active debug session".to_string())
    }
}

#[tauri::command]
pub async fn get_variables(
    variables_reference: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<Vec<Variable>, String> {
    let mut manager = debug_manager.lock().await;
    if let Some(session) = manager.as_mut() {
        let response = session
            .send_request(
                "variables",
                serde_json::json!({ "variablesReference": variables_reference }),
            )
            .await?;

        let variables = response["body"]["variables"]
            .as_array()
            .ok_or("Invalid variables response")?
            .iter()
            .map(|v| Variable {
                name: v["name"].as_str().unwrap_or("").to_string(),
                value: v["value"].as_str().unwrap_or("").to_string(),
                type_: v["type"].as_str().unwrap_or("").to_string(),
                variables_reference: v["variablesReference"].as_u64().unwrap_or(0) as u32,
            })
            .collect();

        Ok(variables)
    } else {
        Err("No active debug session".to_string())
    }
}

#[tauri::command]
pub async fn stop_debug_session(
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<(), String> {
    let mut manager = debug_manager.lock().await;
    if let Some(mut session) = manager.take() {
        session.disconnect().await?;
    }
    Ok(())
}

// Event loop to listen for debug events
async fn debug_event_loop(manager: DebugSessionManager, window: Window) {
    println!("[DEBUG] Event loop started");

    loop {
        // Check if session still exists
        let session_exists = {
            let mgr = manager.lock().await;
            mgr.is_some()
        };

        if !session_exists {
            println!("[DEBUG] Session terminated, exiting event loop");
            break;
        }

        // Read events from debug adapter
        let event_result = {
            let mut mgr = manager.lock().await;
            if let Some(session) = mgr.as_mut() {
                session.read_response().await
            } else {
                break;
            }
        };

        match event_result {
            Ok(event) => {
                let event_type = event["type"].as_str().unwrap_or("");

                if event_type == "event" {
                    let event_name = event["event"].as_str().unwrap_or("");
                    println!("[DEBUG] Event received: {}", event_name);

                    match event_name {
                        "stopped" => {
                            let reason = event["body"]["reason"].as_str().unwrap_or("unknown");
                            let thread_id = event["body"]["threadId"].as_u64().unwrap_or(0);
                            println!("[DEBUG] Stopped - reason: {}, threadId: {}", reason, thread_id);

                            if let Err(e) = window.emit(
                                "debug-stopped",
                                serde_json::json!({
                                    "reason": reason,
                                    "threadId": thread_id
                                }),
                            ) {
                                eprintln!("[DEBUG] Failed to emit debug-stopped event: {}", e);
                            }
                        }
                        "continued" => {
                            println!("[DEBUG] Execution continued");
                            if let Err(e) = window.emit("debug-continued", serde_json::json!({})) {
                                eprintln!("[DEBUG] Failed to emit debug-continued event: {}", e);
                            }
                        }
                        "terminated" => {
                            println!("[DEBUG] Debug session terminated");
                            if let Err(e) = window.emit("debug-terminated", serde_json::json!({})) {
                                eprintln!("[DEBUG] Failed to emit debug-terminated event: {}", e);
                            }
                            // Clean up session
                            let mut mgr = manager.lock().await;
                            *mgr = None;
                            break;
                        }
                        "exited" => {
                            let exit_code = event["body"]["exitCode"].as_i64().unwrap_or(0);
                            println!("[DEBUG] Process exited with code: {}", exit_code);
                        }
                        "output" => {
                            let category = event["body"]["category"].as_str().unwrap_or("stdout");
                            let output = event["body"]["output"].as_str().unwrap_or("");

                            if !output.is_empty() {
                                if let Err(e) = window.emit(
                                    "debug-output",
                                    serde_json::json!({
                                        "category": category,
                                        "output": output
                                    }),
                                ) {
                                    eprintln!("[DEBUG] Failed to emit debug-output event: {}", e);
                                }
                            }
                        }
                        "initialized" => {
                            println!("[DEBUG] Debugger initialized");
                        }
                        "process" => {
                            let name = event["body"]["name"].as_str().unwrap_or("unknown");
                            println!("[DEBUG] Process event: {}", name);
                        }
                        _ => {
                            println!("[DEBUG] Unhandled event: {} - {:?}", event_name, event);
                        }
                    }
                } else if event_type == "response" {
                    // This should not happen in event loop, but log it
                    println!("[DEBUG] Received response in event loop (unexpected): {:?}", event);
                }
            }
            Err(e) => {
                eprintln!("[DEBUG] Event loop error: {}", e);

                // Emit termination event to frontend
                let _ = window.emit("debug-terminated", serde_json::json!({}));

                // Clean up session
                let mut mgr = manager.lock().await;
                *mgr = None;
                break;
            }
        }
    }

    println!("[DEBUG] Event loop stopped");
}
