// Codex Studio — Tauri backend.
// Every GUI action is a `codex` CLI invocation; nothing is reimplemented here.
// The frontend calls these through window.__TAURI__.core.invoke (see codex-core.js).

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Deserialize;
use serde::Serialize;
use std::io::BufRead;
use std::io::BufReader;
use std::path::PathBuf;
use std::process::Command;
use std::process::Stdio;
use tauri::Emitter;

fn codex_home() -> PathBuf {
    std::env::var("CODEX_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| dirs::home_dir().unwrap_or_default().join(".codex"))
}

fn codex_bin() -> String {
    std::env::var("CODEX_BIN").unwrap_or_else(|_| "codex".to_string())
}

#[derive(Serialize)]
struct VersionInfo {
    version: String,
    home: String,
    bridge: String,
}

#[tauri::command]
fn codex_version() -> Result<VersionInfo, String> {
    let out = Command::new(codex_bin())
        .arg("--version")
        .output()
        .map_err(|e| format!("could not run `{}`: {e}", codex_bin()))?;
    Ok(VersionInfo {
        version: String::from_utf8_lossy(&out.stdout).trim().to_string(),
        home: codex_home().display().to_string(),
        bridge: "tauri".into(),
    })
}

#[derive(Serialize)]
struct RunResult {
    code: i32,
    lines: Vec<Line>,
}

#[derive(Serialize, Clone)]
struct Line {
    level: String,
    text: String,
}

#[derive(Deserialize)]
pub struct RunArgs {
    /// Full argv after the `codex` binary, already composed by the GUI.
    pub args: Vec<String>,
    pub cwd: Option<String>,
    /// Event name to stream stdout/stderr lines on, e.g. "codex://stdout".
    pub stream: Option<String>,
}

/// Spawn the CLI, stream each line to the window, and return the exit code.
#[tauri::command]
fn codex_run(app: tauri::AppHandle, args: RunArgs) -> Result<RunResult, String> {
    let mut cmd = Command::new(codex_bin());
    cmd.args(&args.args).stdout(Stdio::piped()).stderr(Stdio::piped());
    if let Some(cwd) = &args.cwd {
        cmd.current_dir(cwd);
    }
    let mut child = cmd.spawn().map_err(|e| e.to_string())?;
    let mut lines: Vec<Line> = Vec::new();

    if let Some(stdout) = child.stdout.take() {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            let l = Line { level: "out".into(), text: line };
            if let Some(ev) = &args.stream {
                let _ = app.emit(ev, l.clone());
            }
            lines.push(l);
        }
    }
    if let Some(stderr) = child.stderr.take() {
        for line in BufReader::new(stderr).lines().map_while(Result::ok) {
            let l = Line { level: "error".into(), text: line };
            if let Some(ev) = &args.stream {
                let _ = app.emit(ev, l.clone());
            }
            lines.push(l);
        }
    }
    let status = child.wait().map_err(|e| e.to_string())?;
    Ok(RunResult { code: status.code().unwrap_or(-1), lines })
}

#[tauri::command]
fn codex_read_config() -> Result<serde_json::Value, String> {
    let path = codex_home().join("config.toml");
    let text = std::fs::read_to_string(&path).unwrap_or_default();
    let parsed: toml::Value = toml::from_str(&text).map_err(|e| e.to_string())?;
    serde_json::to_value(parsed).map_err(|e| e.to_string())
}

/// Write the TOML the GUI composed, after backing up the previous file.
#[tauri::command]
fn codex_write_config(toml_text: String) -> Result<serde_json::Value, String> {
    toml::from_str::<toml::Value>(&toml_text).map_err(|e| format!("refusing to write invalid TOML: {e}"))?;
    let path = codex_home().join("config.toml");
    if path.exists() {
        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or_default();
        let _ = std::fs::copy(&path, path.with_extension(format!("toml.{stamp}.bak")));
    }
    std::fs::create_dir_all(codex_home()).map_err(|e| e.to_string())?;
    std::fs::write(&path, &toml_text).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "written": true, "path": path.display().to_string(), "bytes": toml_text.len() }))
}

macro_rules! cli {
    ($($a:expr),*) => {{
        let out = Command::new(codex_bin()).args([$($a),*]).output().map_err(|e| e.to_string())?;
        Ok(serde_json::json!({
            "code": out.status.code().unwrap_or(-1),
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }))
    }};
}

/// Studio keeps its own git repo (profiles, config snapshots) so every change is
/// revertable. Called after each mutation from the frontend history store.
#[tauri::command]
fn codex_git_commit(message: String, kind: String) -> Result<serde_json::Value, String> {
    let repo = codex_home().join("studio");
    std::fs::create_dir_all(&repo).map_err(|e| e.to_string())?;
    if !repo.join(".git").exists() {
        let _ = Command::new("git").arg("-C").arg(&repo).arg("init").output();
    }
    let _ = Command::new("git").arg("-C").arg(&repo).args(["add", "-A"]).output();
    let out = Command::new("git")
        .arg("-C")
        .arg(&repo)
        .args(["commit", "--allow-empty", "-m", &format!("[{kind}] {message}")])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({
        "ok": out.status.success(),
        "repo": repo.display().to_string(),
        "stdout": String::from_utf8_lossy(&out.stdout)
    }))
}

#[tauri::command]
fn codex_git_log() -> Result<serde_json::Value, String> {
    let repo = codex_home().join("studio");
    let out = Command::new("git")
        .arg("-C")
        .arg(&repo)
        .args(["log", "--pretty=format:%h\u{1f}%at\u{1f}%s", "-n", "200"])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "log": String::from_utf8_lossy(&out.stdout) }))
}

/// Per-tab WSL runtime: spawn a distro instance for a session and run through it.
#[tauri::command]
fn codex_wsl_list() -> Result<serde_json::Value, String> {
    let out = Command::new("wsl.exe").args(["-l", "-q"]).output().map_err(|e| e.to_string())?;
    let text = String::from_utf8_lossy(&out.stdout).replace('\u{0}', "");
    Ok(serde_json::json!({ "distros": text.lines().map(|l| l.trim()).filter(|l| !l.is_empty()).collect::<Vec<_>>() }))
}

#[derive(Deserialize)]
pub struct WslArgs {
    pub session: String,
    pub distro: Option<String>,
    pub cwd: Option<String>,
    pub command: Option<String>,
}

/// Run a command inside the session's distro. The GUI composes `command` from the
/// same flag builder the native console uses, so behaviour matches host runs.
#[tauri::command]
fn codex_wsl_exec(args: WslArgs) -> Result<serde_json::Value, String> {
    let distro = args.distro.unwrap_or_else(|| "Ubuntu".to_string());
    let cwd = args.cwd.unwrap_or_else(|| "~".to_string());
    let command = args.command.unwrap_or_else(|| "codex --version".to_string());
    let out = Command::new("wsl.exe")
        .args(["-d", &distro, "--cd", &cwd, "--", "bash", "-lc", &command])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({
        "code": out.status.code().unwrap_or(-1),
        "session": args.session,
        "stdout": String::from_utf8_lossy(&out.stdout),
        "stderr": String::from_utf8_lossy(&out.stderr)
    }))
}

/// Keep a long-lived shell alive for the session so state (env, cwd) persists.
#[tauri::command]
fn codex_wsl_spawn(args: WslArgs) -> Result<serde_json::Value, String> {
    let distro = args.distro.unwrap_or_else(|| "Ubuntu".to_string());
    let cwd = args.cwd.unwrap_or_else(|| "~".to_string());
    let child = Command::new("wsl.exe")
        .args(["-d", &distro, "--cd", &cwd, "--", "bash", "-lc", "sleep infinity"])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "session": args.session, "distro": distro, "cwd": cwd, "pid": child.id(), "status": "running" }))
}

#[tauri::command]
fn codex_doctor() -> Result<serde_json::Value, String> { cli!("doctor") }

#[tauri::command]
fn codex_features() -> Result<serde_json::Value, String> { cli!("features") }

#[tauri::command]
fn codex_mcp_list() -> Result<serde_json::Value, String> { cli!("mcp", "list", "--json") }

#[tauri::command]
fn codex_plugin_list() -> Result<serde_json::Value, String> { cli!("plugin", "list") }

#[tauri::command]
fn codex_login_status() -> Result<serde_json::Value, String> { cli!("login", "status") }

#[tauri::command]
fn codex_logout() -> Result<serde_json::Value, String> { cli!("logout") }

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            codex_version,
            codex_run,
            codex_read_config,
            codex_write_config,
            codex_doctor,
            codex_wsl_list,
            codex_wsl_spawn,
            codex_wsl_exec,
            codex_git_commit,
            codex_git_log,
            codex_features,
            codex_mcp_list,
            codex_plugin_list,
            codex_login_status,
            codex_logout
        ])
        .run(tauri::generate_context!())
        .expect("error while running Codex Studio");
}
