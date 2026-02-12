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

// [INPUT]: 依赖 tokio 异步 TCP/IO，依赖 std::process 管理 debugpy 进程
// [OUTPUT]: 对外提供 start_debug_session, debug_continue, debug_step_over/into/out,
//           get_stack_trace, get_scopes, get_variables, stop_debug_session 命令，
//           以及 DebugSessionManager, create_debug_manager 类型
// [POS]: commands 模块的 DAP 调试器，通过 TCP 与 debugpy 通信
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

use serde::{Deserialize, Serialize};
use std::process::Child;
use std::sync::Arc;
use tauri::{Emitter, State, Window};
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::Mutex;
use crate::process;

// ============================================================
// 条件调试输出 —— 仅 debug build 可见
// ============================================================

macro_rules! debug_trace {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        eprintln!($($arg)*);
    };
}

// ============================================================
// 调试会话管理
// ============================================================

pub type DebugSessionManager = Arc<Mutex<Option<DebugSession>>>;

pub fn create_debug_manager() -> DebugSessionManager {
    Arc::new(Mutex::new(None))
}

pub struct DebugSession {
    stream: Option<TcpStream>,
    process: Option<Child>,
    seq: u64,
    port: u16,
}

// ============================================================
// DAP 数据类型
// ============================================================

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

// ============================================================
// DAP 消息解析 —— 统一的 Content-Length + JSON 读取
// ============================================================

/// 从 TCP 流读取一条 DAP 消息 (Content-Length header + JSON body)
async fn read_dap_message(reader: &mut BufReader<&mut TcpStream>) -> Result<serde_json::Value, String> {
    // 读取 headers
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

    // 解析 Content-Length
    let content_length: usize = header
        .lines()
        .find(|l| l.starts_with("Content-Length:"))
        .and_then(|l| l.split(':').nth(1))
        .and_then(|s| s.trim().parse().ok())
        .ok_or("Missing Content-Length header")?;

    // 读取 JSON body
    let mut body = vec![0u8; content_length];
    reader
        .read_exact(&mut body)
        .await
        .map_err(|e| format!("Failed to read body: {}", e))?;

    serde_json::from_slice(&body).map_err(|e| format!("Failed to parse JSON: {}", e))
}

// ============================================================
// DebugSession 实现
// ============================================================

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

        let json = serde_json::to_string(&request).map_err(|e| e.to_string())?;
        let message = format!("Content-Length: {}\r\n\r\n{}", json.len(), json);
        stream
            .write_all(message.as_bytes())
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        self.read_response().await
    }

    async fn read_response(&mut self) -> Result<serde_json::Value, String> {
        let stream = self
            .stream
            .as_mut()
            .ok_or("Not connected to debug adapter")?;
        let mut reader = BufReader::new(stream);

        loop {
            let message = read_dap_message(&mut reader).await?;
            let msg_type = message["type"].as_str().unwrap_or("");

            match msg_type {
                "response" => return Ok(message),
                "event" => {
                    debug_trace!("[DEBUG] Skipping event during response read: {}",
                        message["event"].as_str().unwrap_or("unknown"));
                }
                _ => return Ok(message),
            }
        }
    }

    async fn read_message(&mut self) -> Result<serde_json::Value, String> {
        let stream = self
            .stream
            .as_mut()
            .ok_or("Not connected to debug adapter")?;
        let mut reader = BufReader::new(stream);
        read_dap_message(&mut reader).await
    }

    pub fn set_process(&mut self, process: Child) {
        self.process = Some(process);
    }

    pub async fn disconnect(&mut self) -> Result<(), String> {
        if self.stream.is_some() {
            let _ = self
                .send_request("disconnect", serde_json::json!({}))
                .await;
        }
        if let Some(mut process) = self.process.take() {
            let _ = process.kill();
            let _ = process.wait();
        }
        self.stream = None;
        Ok(())
    }
}

// ============================================================
// 端口发现
// ============================================================

async fn find_available_port() -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("Failed to find available port: {}", e))?;
    listener
        .local_addr()
        .map(|a| a.port())
        .map_err(|e| format!("Failed to get port: {}", e))
}

// ============================================================
// Tauri 命令
// ============================================================

#[tauri::command]
pub async fn start_debug_session(
    window: Window,
    project_path: String,
    script_path: String,
    breakpoints: Vec<Breakpoint>,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<String, String> {
    debug_trace!("[DEBUG] Starting debug session for: {}", script_path);

    let python_exe = if cfg!(target_os = "windows") {
        format!("{}/.venv/Scripts/python.exe", project_path)
    } else {
        format!("{}/.venv/bin/python", project_path)
    };

    if !std::path::Path::new(&python_exe).exists() {
        return Err(format!(
            "Python 可执行文件未找到: {}\n\n请先创建虚拟环境：\n1. 打开项目设置\n2. 创建 Python 虚拟环境",
            python_exe
        ));
    }

    // 检查 debugpy
    let mut check_cmd = process::std_cmd(&python_exe);
    check_cmd.args(["-m", "debugpy", "--version"]);
    let check_output = check_cmd.output()
        .map_err(|e| format!("Failed to check debugpy: {}", e))?;

    if !check_output.status.success() {
        let stderr = String::from_utf8_lossy(&check_output.stderr);
        return Err(format!(
            "debugpy 未安装。请通过以下方式安装：\n1. 点击工具栏的「包管理」按钮\n2. 搜索 \"debugpy\"\n3. 点击安装\n\nError: {}",
            stderr
        ));
    }

    debug_trace!("[DEBUG] debugpy version: {}", String::from_utf8_lossy(&check_output.stdout).trim());

    let port = find_available_port().await?;
    debug_trace!("[DEBUG] Using port: {}", port);

    let mut cmd = process::std_cmd_in(&python_exe, &project_path);
    cmd.args([
        "-m", "debugpy", "--listen",
        &format!("localhost:{}", port),
        "--wait-for-client",
        &script_path,
    ]);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!(
            "启动 debugpy 失败: {}。\n请确保已安装 debugpy（通过工具栏「包管理」按钮安装）", e
        ))?;

    debug_trace!("[DEBUG] debugpy process started with PID: {:?}", child.id());

    let stderr = child.stderr.take();
    let mut session = DebugSession::new(port);
    session.set_process(child);

    // 重试连接
    let max_retries = 10;
    let mut connected = false;
    for i in 0..max_retries {
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        match session.connect().await {
            Ok(_) => {
                connected = true;
                debug_trace!("[DEBUG] Connected to debugpy on attempt {}", i + 1);
                break;
            }
            Err(e) => {
                if i == max_retries - 1 {
                    if let Some(mut stderr_reader) = stderr {
                        let mut stderr_output = String::new();
                        use std::io::Read;
                        let _ = stderr_reader.read_to_string(&mut stderr_output);
                        if !stderr_output.is_empty() {
                            return Err(format!(
                                "Failed to connect to debugpy: {}\nDebugpy error: {}", e, stderr_output
                            ));
                        }
                    }
                    return Err(format!(
                        "连接 debugpy 失败（尝试 {} 次后）: {}\n\n请检查：\n1. debugpy 是否已安装（通过工具栏「包管理」安装）\n2. Python 虚拟环境是否已创建\n3. 端口 {} 是否被占用",
                        max_retries, e, port
                    ));
                }
                debug_trace!("[DEBUG] Connection attempt {} failed: {}, retrying...", i + 1, e);
            }
        }
    }

    if !connected {
        return Err("Failed to connect to debugpy".to_string());
    }

    // DAP 握手
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
    debug_trace!("[DEBUG] Initialized: {:?}", init_response);

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
    debug_trace!("[DEBUG] Launch: {:?}", launch_response);

    // 设置断点
    if !breakpoints.is_empty() {
        let file_path = &breakpoints[0].file;
        let bp_lines: Vec<serde_json::Value> = breakpoints
            .iter()
            .map(|bp| serde_json::json!({ "line": bp.line }))
            .collect();

        let bp_response = session
            .send_request(
                "setBreakpoints",
                serde_json::json!({
                    "source": { "path": file_path },
                    "breakpoints": bp_lines
                }),
            )
            .await?;
        debug_trace!("[DEBUG] Breakpoints set: {:?}", bp_response);
    }

    let config_response = session
        .send_request("configurationDone", serde_json::json!({}))
        .await?;
    debug_trace!("[DEBUG] Configuration done: {:?}", config_response);

    {
        let mut manager = debug_manager.lock().await;
        *manager = Some(session);
    }

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
    let session = manager.as_mut().ok_or("No active debug session")?;
    session
        .send_request("continue", serde_json::json!({ "threadId": thread_id }))
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn debug_step_over(
    thread_id: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<(), String> {
    let mut manager = debug_manager.lock().await;
    let session = manager.as_mut().ok_or("No active debug session")?;
    session
        .send_request("next", serde_json::json!({ "threadId": thread_id }))
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn debug_step_into(
    thread_id: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<(), String> {
    let mut manager = debug_manager.lock().await;
    let session = manager.as_mut().ok_or("No active debug session")?;
    session
        .send_request("stepIn", serde_json::json!({ "threadId": thread_id }))
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn debug_step_out(
    thread_id: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<(), String> {
    let mut manager = debug_manager.lock().await;
    let session = manager.as_mut().ok_or("No active debug session")?;
    session
        .send_request("stepOut", serde_json::json!({ "threadId": thread_id }))
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn get_stack_trace(
    thread_id: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<Vec<StackFrame>, String> {
    let mut manager = debug_manager.lock().await;
    let session = manager.as_mut().ok_or("No active debug session")?;
    let response = session
        .send_request("stackTrace", serde_json::json!({ "threadId": thread_id }))
        .await?;

    response["body"]["stackFrames"]
        .as_array()
        .ok_or("Invalid stackTrace response".to_string())
        .map(|frames| {
            frames
                .iter()
                .map(|f| StackFrame {
                    id: f["id"].as_u64().unwrap_or(0) as u32,
                    name: f["name"].as_str().unwrap_or("").to_string(),
                    file: f["source"]["path"].as_str().unwrap_or("").to_string(),
                    line: f["line"].as_u64().unwrap_or(0) as u32,
                    column: f["column"].as_u64().unwrap_or(0) as u32,
                })
                .collect()
        })
}

#[tauri::command]
pub async fn get_scopes(
    frame_id: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<Vec<Scope>, String> {
    let mut manager = debug_manager.lock().await;
    let session = manager.as_mut().ok_or("No active debug session")?;
    let response = session
        .send_request("scopes", serde_json::json!({ "frameId": frame_id }))
        .await?;

    response["body"]["scopes"]
        .as_array()
        .ok_or("Invalid scopes response".to_string())
        .map(|scopes| {
            scopes
                .iter()
                .map(|s| Scope {
                    name: s["name"].as_str().unwrap_or("").to_string(),
                    variables_reference: s["variablesReference"].as_u64().unwrap_or(0) as u32,
                    expensive: s["expensive"].as_bool().unwrap_or(false),
                })
                .collect()
        })
}

#[tauri::command]
pub async fn get_variables(
    variables_reference: u32,
    debug_manager: State<'_, DebugSessionManager>,
) -> Result<Vec<Variable>, String> {
    let mut manager = debug_manager.lock().await;
    let session = manager.as_mut().ok_or("No active debug session")?;
    let response = session
        .send_request(
            "variables",
            serde_json::json!({ "variablesReference": variables_reference }),
        )
        .await?;

    response["body"]["variables"]
        .as_array()
        .ok_or("Invalid variables response".to_string())
        .map(|vars| {
            vars.iter()
                .map(|v| Variable {
                    name: v["name"].as_str().unwrap_or("").to_string(),
                    value: v["value"].as_str().unwrap_or("").to_string(),
                    type_: v["type"].as_str().unwrap_or("").to_string(),
                    variables_reference: v["variablesReference"].as_u64().unwrap_or(0) as u32,
                })
                .collect()
        })
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

// ============================================================
// 事件循环 —— 监听 DAP 事件并转发到前端
// ============================================================

async fn debug_event_loop(manager: DebugSessionManager, window: Window) {
    debug_trace!("[DEBUG] Event loop started");

    loop {
        let session_exists = {
            let mgr = manager.lock().await;
            mgr.is_some()
        };

        if !session_exists {
            debug_trace!("[DEBUG] Session terminated, exiting event loop");
            break;
        }

        let event_result = {
            let mut mgr = manager.lock().await;
            if let Some(session) = mgr.as_mut() {
                session.read_message().await
            } else {
                break;
            }
        };

        match event_result {
            Ok(event) => {
                let event_type = event["type"].as_str().unwrap_or("");
                if event_type == "event" {
                    let event_name = event["event"].as_str().unwrap_or("");
                    debug_trace!("[DEBUG] Event received: {}", event_name);

                    match event_name {
                        "stopped" => {
                            let reason = event["body"]["reason"].as_str().unwrap_or("unknown");
                            let thread_id = event["body"]["threadId"].as_u64().unwrap_or(0);
                            debug_trace!("[DEBUG] Stopped - reason: {}, threadId: {}", reason, thread_id);
                            let _ = window.emit(
                                "debug-stopped",
                                serde_json::json!({ "reason": reason, "threadId": thread_id }),
                            );
                        }
                        "continued" => {
                            let _ = window.emit("debug-continued", serde_json::json!({}));
                        }
                        "terminated" => {
                            debug_trace!("[DEBUG] Debug session terminated");
                            let _ = window.emit("debug-terminated", serde_json::json!({}));
                            let mut mgr = manager.lock().await;
                            *mgr = None;
                            break;
                        }
                        "exited" => {
                            debug_trace!("[DEBUG] Process exited with code: {}",
                                event["body"]["exitCode"].as_i64().unwrap_or(0));
                        }
                        "output" => {
                            let category = event["body"]["category"].as_str().unwrap_or("stdout");
                            let output = event["body"]["output"].as_str().unwrap_or("");
                            if !output.is_empty() {
                                let _ = window.emit(
                                    "debug-output",
                                    serde_json::json!({ "category": category, "output": output }),
                                );
                            }
                        }
                        "breakpoint" => {
                            let _ = window.emit(
                                "debug-breakpoint",
                                serde_json::json!({
                                    "reason": event["body"]["reason"].as_str().unwrap_or(""),
                                    "breakpoint": event["body"]["breakpoint"].clone()
                                }),
                            );
                        }
                        "initialized" | "process" => {
                            debug_trace!("[DEBUG] {} event", event_name);
                        }
                        _ => {
                            debug_trace!("[DEBUG] Unhandled event: {}", event_name);
                        }
                    }
                } else if event_type == "response" {
                    debug_trace!("[DEBUG] Unexpected response in event loop");
                }
            }
            Err(e) => {
                eprintln!("[DEBUG] Event loop error: {}", e);
                let _ = window.emit("debug-terminated", serde_json::json!({}));
                let mut mgr = manager.lock().await;
                *mgr = None;
                break;
            }
        }
    }

    debug_trace!("[DEBUG] Event loop stopped");
}
