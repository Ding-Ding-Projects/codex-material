//! Per-tab WSL runtimes.
//!
//! A session can pin itself to a distro; Studio then keeps one long-lived shell
//! alive for that session so `cd`, env vars and background jobs persist between
//! commands instead of every run starting from scratch.

use crate::cli::command;
use serde::Deserialize;
use serde_json::json;
use serde_json::Value as Json;
use std::collections::HashMap;
use std::process::Child;
use std::process::Stdio;
use std::sync::Mutex;

pub struct Instance {
    pub distro: String,
    pub cwd: String,
    pub pid: u32,
    pub started_at: u64,
    pub auto: bool,
    child: Option<Child>,
}

impl Instance {
    fn to_json(&self, session: &str, status: &str) -> Json {
        json!({
            "session": session,
            "distro": self.distro,
            "cwd": self.cwd,
            "pid": self.pid,
            "startedAt": self.started_at,
            "auto": self.auto,
            "status": status
        })
    }
}

#[derive(Default)]
pub struct Runtimes(pub Mutex<HashMap<String, Instance>>);

#[derive(Deserialize)]
pub struct WslArgs {
    pub session: String,
    pub distro: Option<String>,
    pub cwd: Option<String>,
    pub command: Option<String>,
    pub auto: Option<bool>,
    pub patch: Option<Json>,
}

fn now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

/// `wsl -l -q` emits UTF-16LE; decode it rather than lossily reading UTF-8, which
/// would turn every distro name into NUL-separated garbage.
fn decode_wsl(bytes: &[u8]) -> String {
    if bytes.len() >= 2
        && bytes.iter().skip(1).step_by(2).filter(|b| **b == 0).count() > bytes.len() / 4
    {
        let units: Vec<u16> = bytes
            .chunks_exact(2)
            .map(|c| u16::from_le_bytes([c[0], c[1]]))
            .collect();
        return String::from_utf16_lossy(&units);
    }
    String::from_utf8_lossy(bytes).into_owned()
}

pub fn distros() -> Result<Vec<String>, String> {
    let out = command("wsl.exe")
        .args(["-l", "-q"])
        .output()
        .map_err(|e| format!("WSL is not available: {e}"))?;
    Ok(decode_wsl(&out.stdout)
        .lines()
        .map(|l| l.trim().trim_matches('\u{feff}').to_string())
        .filter(|l| !l.is_empty())
        .collect())
}

pub fn list(state: &Runtimes) -> Json {
    let mut map = state.0.lock().unwrap();
    let mut out = serde_json::Map::new();
    for (session, inst) in map.iter_mut() {
        // A `try_wait` that yields Some means the shell exited on its own.
        let status = match inst.child.as_mut().map(|c| c.try_wait()) {
            Some(Ok(Some(_))) | None => "stopped",
            Some(Ok(None)) => "running",
            Some(Err(_)) => "unknown",
        };
        out.insert(session.clone(), inst.to_json(session, status));
    }
    json!({
        "distros": distros().unwrap_or_default(),
        "instances": Json::Object(out)
    })
}

pub fn spawn(state: &Runtimes, args: &WslArgs) -> Result<Json, String> {
    let available = distros()?;
    let distro = args
        .distro
        .clone()
        .or_else(|| available.first().cloned())
        .ok_or("no WSL distribution is installed")?;
    if !available.iter().any(|d| d == &distro) {
        return Err(format!("`{distro}` is not an installed WSL distribution"));
    }
    let cwd = args.cwd.clone().unwrap_or_else(|| "~".to_string());
    // `sleep infinity` under a login shell keeps the namespace and the mounted
    // drives alive for the tab without holding a pty open.
    let child = command("wsl.exe")
        .args([
            "-d",
            &distro,
            "--cd",
            &cwd,
            "--",
            "bash",
            "-lc",
            "sleep infinity",
        ])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("could not start `{distro}`: {e}"))?;
    let pid = child.id();
    let inst = Instance {
        distro,
        cwd,
        pid,
        started_at: now(),
        auto: args.auto.unwrap_or(true),
        child: Some(child),
    };
    let value = inst.to_json(&args.session, "running");
    stop_inner(state, &args.session);
    state.0.lock().unwrap().insert(args.session.clone(), inst);
    Ok(value)
}

fn stop_inner(state: &Runtimes, session: &str) -> bool {
    let mut map = state.0.lock().unwrap();
    match map.get_mut(session).and_then(|i| i.child.as_mut()) {
        Some(child) => {
            let _ = child.kill();
            let _ = child.wait();
            true
        }
        None => false,
    }
}

pub fn stop(state: &Runtimes, session: &str) -> Json {
    let existed = stop_inner(state, session);
    let map = state.0.lock().unwrap();
    match map.get(session) {
        Some(inst) => inst.to_json(session, "stopped"),
        None => json!({ "session": session, "status": if existed { "stopped" } else { "absent" } }),
    }
}

pub fn kill(state: &Runtimes, session: &str) -> Json {
    stop_inner(state, session);
    state.0.lock().unwrap().remove(session);
    list(state)
}

pub fn set(state: &Runtimes, session: &str, patch: &Json) -> Json {
    {
        let mut map = state.0.lock().unwrap();
        if let Some(inst) = map.get_mut(session) {
            if let Some(cwd) = patch.get("cwd").and_then(|v| v.as_str()) {
                inst.cwd = cwd.to_string();
            }
            if let Some(distro) = patch.get("distro").and_then(|v| v.as_str()) {
                inst.distro = distro.to_string();
            }
            if let Some(auto) = patch.get("auto").and_then(|v| v.as_bool()) {
                inst.auto = auto;
            }
        }
    }
    list(state)
}

/// Run one command inside the session's distro. Falls back to a one-shot
/// invocation when no instance is pinned, so a run never silently does nothing.
pub fn exec(state: &Runtimes, args: &WslArgs) -> Result<Json, String> {
    let (distro, cwd) = {
        let map = state.0.lock().unwrap();
        match map.get(&args.session) {
            Some(inst) => (inst.distro.clone(), inst.cwd.clone()),
            None => (
                args.distro
                    .clone()
                    .or_else(|| distros().ok().and_then(|d| d.first().cloned()))
                    .ok_or("no WSL distribution is installed")?,
                args.cwd.clone().unwrap_or_else(|| "~".to_string()),
            ),
        }
    };
    let cmd_text = args
        .command
        .clone()
        .unwrap_or_else(|| "codex --version".to_string());
    let out = command("wsl.exe")
        .args(["-d", &distro, "--cd", &cwd, "--", "bash", "-lc", &cmd_text])
        .output()
        .map_err(|e| format!("could not run in `{distro}`: {e}"))?;
    let mut lines = vec![
        json!({ "level": "cmd", "text": format!("wsl -d {distro} --cd {cwd} -- {cmd_text}") }),
    ];
    for line in String::from_utf8_lossy(&out.stdout).lines() {
        lines.push(json!({ "level": "out", "text": line }));
    }
    for line in String::from_utf8_lossy(&out.stderr).lines() {
        lines.push(json!({ "level": "error", "text": line }));
    }
    Ok(json!({
        "code": out.status.code().unwrap_or(-1),
        "session": args.session,
        "distro": distro,
        "cwd": cwd,
        "lines": lines
    }))
}
